from flask import Flask, request, jsonify, session
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import mysql.connector
import smtplib
import os
import random
import time
from email.message import EmailMessage


# --------------------------------
# Load .env
# --------------------------------
load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
CORS(
    app,
    supports_credentials=True
)

pending_registrations = {}

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "No registration data received."
        }), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    usn = data.get("usn", "").strip().upper()
    department = data.get("department", "").strip()
    year = data.get("year")
    password = data.get("password", "")

    if not name or not email or not usn or not department or not year or not password:
        return jsonify({
          "message": "All fields are required."
        }), 400

    if not email.endswith("@cmrit.ac.in"):
        return jsonify({
            "message": "Please use your CMRIT college email."
        }), 400

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute(
        "SELECT id FROM users WHERE email = %s OR usn = %s",
        (email, usn)
    )

    existing_user = cursor.fetchone()

    if existing_user:
        cursor.close()
        db.close()

        return jsonify({
            "message": "Email or USN is already registered."
        }), 409

    cursor.close()
    db.close()

    otp = str(random.randint(100000, 999999))

    pending_registrations[email] = {
        "name": name,
        "email": email,
        "usn": usn,
        "department": department,
        "year": year,
        "password": password,
        "otp": otp,
        "expires_at": time.time() + 300
    }

    try:
        message = EmailMessage()

        message["Subject"] = "Campus Connect - Registration OTP"
        message["From"] = EMAIL_USER
        message["To"] = email

        message.set_content(
            f"""Hello,

        Your Campus Connect registration OTP is:

        {otp}

        This OTP is valid for 5 minutes.

        Please do not share this OTP with anyone.

        Regards,
        Campus Connect Team
        """
        )

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(message)

        print(f"Registration OTP sent to: {email}")

        return jsonify({
            "message": "OTP sent successfully. Please check your email."
        }), 200

    except smtplib.SMTPAuthenticationError:
        return jsonify({
            "message": "Gmail authentication failed."
        }), 500

    except Exception as error:
        print("EMAIL ERROR:", error)

        return jsonify({
            "message": "Unable to send OTP."
        }), 500

@app.route("/verify-registration-otp", methods=["POST"])

def verify_registration_otp():
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Invalid request."
        }), 400

    email = data.get("email", "").strip().lower()
    otp = data.get("otp", "").strip()

    if not email or not otp:
        return jsonify({
            "message": "Email and OTP are required."
        }), 400


    registration = pending_registrations.get(email)

    if not registration:
        return jsonify({
            "message": "Registration not found. Please register again."
        }), 400

    if time.time() > registration["expires_at"]:
        del pending_registrations[email]

        return jsonify({
            "message": "OTP expired. Please register again."
        }), 400

    if registration["otp"] != otp:
        return jsonify({
            "message": "Incorrect OTP."
        }), 400
    
    password_hash = generate_password_hash(
        registration["password"]
    )

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO users
        (name, email, usn, department, year, password_hash, is_verified)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            registration["name"],
            registration["email"],
            registration["usn"],
            registration["department"],
            registration["year"],
            password_hash,
            True
        )
    )

    db.commit()

    cursor.close()
    db.close()

    del pending_registrations[email]

    return jsonify({
    "message": "Registration successful. Your account has been created."
    }), 201

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Invalid request."
        }), 400
    
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required."
        }), 400

    db = get_db_connection()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM users WHERE email = %s",
        (email,)
    )

    user = cursor.fetchone()
    if not user:
        cursor.close()
        db.close()

        return jsonify({
            "message": "Invalid email or password."
        }), 401

    if not user["is_verified"]:
        cursor.close()
        db.close()

        return jsonify({
            "message": "Please verify your email before logging in."
        }), 403

    if not check_password_hash(
        user["password_hash"],
        password
    ):
        cursor.close()
        db.close()

        return jsonify({
            "message": "Invalid email or password."
        }), 401

    session["user_id"] = user["id"]
    session["user_email"] = user["email"]
    session["user_name"] = user["name"]

    cursor.close()
    db.close()

    return jsonify({
        "message": "Login successful.",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }), 200

@app.route("/me", methods=["GET"])
def get_current_user():
    if "user_id" not in session:
        return jsonify({
            "message": "Not logged in."
        }), 401

    return jsonify({
        "user": {
            "id": session["user_id"],
            "name": session["user_name"],
            "email": session["user_email"]
        }
    }), 200

@app.route("/logout", methods=["POST"])
def logout():
    session.clear()

    return jsonify({
        "message": "Logout successful."
    }), 200
# --------------------------------
# Gmail configuration
# --------------------------------
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# Temporary OTP storage
otp_store = {}


# --------------------------------
# SEND OTP
# --------------------------------
@app.route("/send-otp", methods=["POST"])
def send_otp():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Invalid request."
        }), 400

    email = data.get("email", "").strip().lower()

    # Check CMRIT email
    if not email.endswith("@cmrit.ac.in"):
        return jsonify({
            "message": "Please use your CMRIT college email."
        }), 400

    # Check Gmail credentials
    if not EMAIL_USER or not EMAIL_PASS:
        print("ERROR: EMAIL_USER or EMAIL_PASS is missing in .env")

        return jsonify({
            "message": "Email server is not configured."
        }), 500

    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))

    # Store OTP for 5 minutes
    otp_store[email] = {
        "otp": otp,
        "expires_at": time.time() + 300
    }

    try:

        # Create email
        message = EmailMessage()

        message["Subject"] = "Campus Connect - Email Verification OTP"
        message["From"] = EMAIL_USER
        message["To"] = email

        message.set_content(
            f"""Hello,

Your Campus Connect verification OTP is:

{otp}

This OTP is valid for 5 minutes.

Please do not share this OTP with anyone.

Regards,
Campus Connect Team
"""
        )

        # Connect to Gmail SMTP
        with smtplib.SMTP("smtp.gmail.com", 587) as server:

            server.ehlo()

            server.starttls()

            server.ehlo()

            # Login using Gmail App Password
            server.login(
                EMAIL_USER,
                EMAIL_PASS
            )

            # Send email
            server.send_message(message)

        print(f"OTP successfully sent to: {email}")

        return jsonify({
            "message": "OTP sent successfully."
        }), 200

    except smtplib.SMTPAuthenticationError as error:

        print("GMAIL AUTHENTICATION ERROR:", error)

        return jsonify({
            "message": "Gmail authentication failed. Check EMAIL_USER and Google App Password."
        }), 500

    except Exception as error:

        print("EMAIL ERROR:", error)

        return jsonify({
            "message": "Unable to send OTP."
        }), 500


# --------------------------------
# VERIFY OTP
# --------------------------------
@app.route("/verify-otp", methods=["POST"])
def verify_otp():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Invalid request."
        }), 400

    email = data.get("email", "").strip().lower()
    otp = data.get("otp", "").strip()

    # Find OTP
    record = otp_store.get(email)

    if not record:
        return jsonify({
            "message": "OTP not found. Please request a new OTP."
        }), 400

    # Check expiry
    if time.time() > record["expires_at"]:

        del otp_store[email]

        return jsonify({
            "message": "OTP expired. Please request a new OTP."
        }), 400

    # Check OTP
    if record["otp"] != otp:

        return jsonify({
            "message": "Incorrect OTP."
        }), 400

    # OTP correct
    del otp_store[email]

    print(f"Email verified successfully: {email}")

    return jsonify({
        "message": "Email verified successfully."
    }), 200


# --------------------------------
# START SERVER
# --------------------------------
if __name__ == "__main__":

    print("--------------------------------")
    print("Campus Connect Python Backend")
    print("--------------------------------")

    if EMAIL_USER:
        print("EMAIL_USER loaded:", EMAIL_USER)
    else:
        print("ERROR: EMAIL_USER not found")

    if EMAIL_PASS:
        print("EMAIL_PASS loaded: YES")
    else:
        print("ERROR: EMAIL_PASS not found")

    print("--------------------------------")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )