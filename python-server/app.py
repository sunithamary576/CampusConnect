from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
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
CORS(app)

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