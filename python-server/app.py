from flask import (
    Flask,
    request,
    jsonify,
    session,
    send_from_directory
)

from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import (
    generate_password_hash,
    check_password_hash
)
from werkzeug.utils import secure_filename

import mysql.connector
import smtplib
import os
import random
import time

from email.message import EmailMessage


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# FLASK APP CONFIGURATION
# ============================================================

app = Flask(__name__)

app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

CORS(
    app,
    supports_credentials=True
)


# ============================================================
# FILE UPLOAD CONFIGURATION
# ============================================================

UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "uploads"
)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)

ALLOWED_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "pdf",
    "doc",
    "docx"
}

MAX_FILE_SIZE = 3 * 1024 * 1024

app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE


def allowed_file(filename):

    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_db_connection():

    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )


# ============================================================
# GMAIL CONFIGURATION
# ============================================================

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")


# ============================================================
# TEMPORARY OTP STORAGE
# ============================================================

# Registration OTP data
pending_registrations = {}

# General email verification OTP
otp_store = {}

# Successfully verified password-reset emails
reset_verified = set()


# ============================================================
# REGISTRATION
# ============================================================

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

    if (
        not name
        or not email
        or not usn
        or not department
        or not year
        or not password
    ):
        return jsonify({
            "message": "All fields are required."
        }), 400

    if not email.endswith("@cmrit.ac.in"):

        return jsonify({
            "message": "Please use your CMRIT college email."
        }), 400

    # Check database for duplicate email or USN

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute(
        """
        SELECT id
        FROM users
        WHERE email = %s OR usn = %s
        """,
        (email, usn)
    )

    existing_user = cursor.fetchone()

    cursor.close()
    db.close()

    if existing_user:

        return jsonify({
            "message": "Email or USN is already registered."
        }), 409

    # Generate OTP

    otp = str(
        random.randint(100000, 999999)
    )

    # Store temporary registration

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

    # Check email configuration

    if not EMAIL_USER or not EMAIL_PASS:

        print(
            "ERROR: EMAIL_USER or EMAIL_PASS is missing."
        )

        return jsonify({
            "message": "Email server is not configured."
        }), 500

    try:

        message = EmailMessage()

        message["Subject"] = (
            "Campus Connect - Registration OTP"
        )

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

        with smtplib.SMTP(
            "smtp.gmail.com",
            587
        ) as server:

            server.ehlo()

            server.starttls()

            server.ehlo()

            server.login(
                EMAIL_USER,
                EMAIL_PASS
            )

            server.send_message(message)

        print(
            f"Registration OTP sent to: {email}"
        )

        return jsonify({
            "message": (
                "OTP sent successfully. "
                "Please check your email."
            )
        }), 200

    except smtplib.SMTPAuthenticationError:

        return jsonify({
            "message": "Gmail authentication failed."
        }), 500

    except Exception as error:

        print(
            "EMAIL ERROR:",
            error
        )

        return jsonify({
            "message": "Unable to send OTP."
        }), 500


# ============================================================
# VERIFY REGISTRATION OTP
# ============================================================

@app.route(
    "/verify-registration-otp",
    methods=["POST"]
)
def verify_registration_otp():

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Invalid request."
        }), 400

    email = data.get(
        "email",
        ""
    ).strip().lower()

    otp = data.get(
        "otp",
        ""
    ).strip()

    if not email or not otp:

        return jsonify({
            "message": "Email and OTP are required."
        }), 400

    registration = pending_registrations.get(
        email
    )

    if not registration:

        return jsonify({
            "message": (
                "Registration not found. "
                "Please register again."
            )
        }), 400

    # Check OTP expiry

    if time.time() > registration["expires_at"]:

        del pending_registrations[email]

        return jsonify({
            "message": (
                "OTP expired. "
                "Please register again."
            )
        }), 400

    # Check OTP

    if registration["otp"] != otp:

        return jsonify({
            "message": "Incorrect OTP."
        }), 400

    # Hash password before storing it

    password_hash = generate_password_hash(
        registration["password"]
    )

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO users
        (
            name,
            email,
            usn,
            department,
            year,
            password_hash,
            is_verified
        )
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

    # Remove temporary registration

    del pending_registrations[email]

    return jsonify({
        "message": (
            "Registration successful. "
            "Your account has been created."
        )
    }), 201


# ============================================================
# LOGIN
# ============================================================

@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Invalid request."
        }), 400

    email = data.get(
        "email",
        ""
    ).strip().lower()

    password = data.get(
        "password",
        ""
    )

    if not email or not password:

        return jsonify({
            "message": (
                "Email and password are required."
            )
        }), 400

    db = get_db_connection()
    cursor = db.cursor(
        dictionary=True
    )

    cursor.execute(
        """
        SELECT *
        FROM users
        WHERE email = %s
        """,
        (email,)
    )

    user = cursor.fetchone()

    if not user:

        cursor.close()
        db.close()

        return jsonify({
            "message": (
                "Invalid email or password."
            )
        }), 401

    if not user["is_verified"]:

        cursor.close()
        db.close()

        return jsonify({
            "message": (
                "Please verify your email "
                "before logging in."
            )
        }), 403

    if not check_password_hash(
        user["password_hash"],
        password
    ):

        cursor.close()
        db.close()

        return jsonify({
            "message": (
                "Invalid email or password."
            )
        }), 401

    # Create Flask session

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


# ============================================================
# CURRENT LOGGED-IN USER
# ============================================================

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


# ============================================================
# LOGOUT
# ============================================================

@app.route("/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "message": "Logout successful."
    }), 200


# ============================================================
# GENERAL EMAIL OTP
# ============================================================

@app.route("/send-otp", methods=["POST"])
def send_otp():

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Invalid request."
        }), 400

    email = data.get(
        "email",
        ""
    ).strip().lower()

    if not email.endswith("@cmrit.ac.in"):

        return jsonify({
            "message": (
                "Please use your CMRIT college email."
            )
        }), 400

    if not EMAIL_USER or not EMAIL_PASS:

        print(
            "ERROR: EMAIL_USER or EMAIL_PASS "
            "is missing."
        )

        return jsonify({
            "message": (
                "Email server is not configured."
            )
        }), 500

    otp = str(
        random.randint(100000, 999999)
    )

    otp_store[email] = {

        "otp": otp,

        "expires_at": (
            time.time() + 300
        )
    }

    try:

        message = EmailMessage()

        message["Subject"] = (
            "Campus Connect - Email Verification OTP"
        )

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

        with smtplib.SMTP(
            "smtp.gmail.com",
            587
        ) as server:

            server.ehlo()
            server.starttls()
            server.ehlo()

            server.login(
                EMAIL_USER,
                EMAIL_PASS
            )

            server.send_message(message)

        print(
            f"OTP successfully sent to: {email}"
        )

        return jsonify({
            "message": "OTP sent successfully."
        }), 200

    except smtplib.SMTPAuthenticationError as error:

        print(
            "GMAIL AUTHENTICATION ERROR:",
            error
        )

        return jsonify({
            "message": (
                "Gmail authentication failed. "
                "Check EMAIL_USER and "
                "Google App Password."
            )
        }), 500

    except Exception as error:

        print(
            "EMAIL ERROR:",
            error
        )

        return jsonify({
            "message": "Unable to send OTP."
        }), 500


# ============================================================
# VERIFY GENERAL OTP
# ============================================================

@app.route("/verify-otp", methods=["POST"])
def verify_otp():

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Invalid request."
        }), 400

    email = data.get(
        "email",
        ""
    ).strip().lower()

    otp = data.get(
        "otp",
        ""
    ).strip()

    record = otp_store.get(email)

    if not record:

        return jsonify({
            "message": (
                "OTP not found. "
                "Please request a new OTP."
            )
        }), 400

    if time.time() > record["expires_at"]:

        del otp_store[email]

        return jsonify({
            "message": (
                "OTP expired. "
                "Please request a new OTP."
            )
        }), 400

    if record["otp"] != otp:

        return jsonify({
            "message": "Incorrect OTP."
        }), 400

    del otp_store[email]

    print(
        f"Email verified successfully: {email}"
    )

    return jsonify({
        "message": (
            "Email verified successfully."
        )
    }), 200


# ============================================================
# SEND PASSWORD RESET OTP
# ============================================================

@app.route(
    "/send-reset-otp",
    methods=["POST"]
)
def send_reset_otp():

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Invalid request."
        }), 400

    email = data.get(
        "email",
        ""
    ).strip().lower()

    if not email:

        return jsonify({
            "message": "Email is required."
        }), 400

    if not email.endswith("@cmrit.ac.in"):

        return jsonify({
            "message": (
                "Please use your CMRIT college email."
            )
        }), 400

    # Check whether account exists

    db = get_db_connection()
    cursor = db.cursor(
        dictionary=True
    )

    cursor.execute(
        """
        SELECT id
        FROM users
        WHERE email = %s
        """,
        (email,)
    )

    user = cursor.fetchone()

    cursor.close()
    db.close()

    if not user:

        return jsonify({
            "message": (
                "No account found with this email."
            )
        }), 404

    if not EMAIL_USER or not EMAIL_PASS:

        return jsonify({
            "message": (
                "Email server is not configured."
            )
        }), 500

    # Generate reset OTP

    otp = str(
        random.randint(100000, 999999)
    )

    otp_store[email] = {

        "otp": otp,

        "expires_at": (
            time.time() + 300
        )
    }

    try:

        message = EmailMessage()

        message["Subject"] = (
            "Campus Connect - Password Reset OTP"
        )

        message["From"] = EMAIL_USER
        message["To"] = email

        message.set_content(
            f"""Hello,

Your Campus Connect password reset OTP is:

{otp}

This OTP is valid for 5 minutes.

If you did not request a password reset,
you can ignore this email.

Regards,
Campus Connect Team
"""
        )

        with smtplib.SMTP(
            "smtp.gmail.com",
            587
        ) as server:

            server.ehlo()
            server.starttls()
            server.ehlo()

            server.login(
                EMAIL_USER,
                EMAIL_PASS
            )

            server.send_message(message)

        print(
            f"Password reset OTP sent to: {email}"
        )

        return jsonify({
            "message": (
                "Reset OTP sent successfully."
            )
        }), 200

    except smtplib.SMTPAuthenticationError:

        return jsonify({
            "message": (
                "Gmail authentication failed."
            )
        }), 500

    except Exception as error:

        print(
            "RESET EMAIL ERROR:",
            error
        )

        return jsonify({
            "message": (
                "Unable to send reset OTP."
            )
        }), 500


# ============================================================
# VERIFY PASSWORD RESET OTP
# ============================================================

@app.route(
    "/verify-reset-otp",
    methods=["POST"]
)
def verify_reset_otp():

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Invalid request."
        }), 400

    email = data.get(
        "email",
        ""
    ).strip().lower()

    otp = data.get(
        "otp",
        ""
    ).strip()

    if not email or not otp:

        return jsonify({
            "message": (
                "Email and OTP are required."
            )
        }), 400

    stored_otp = otp_store.get(email)

    if not stored_otp:

        return jsonify({
            "message": (
                "OTP not found. "
                "Please request a new OTP."
            )
        }), 400

    if time.time() > stored_otp["expires_at"]:

        del otp_store[email]

        return jsonify({
            "message": (
                "OTP expired. "
                "Please request a new OTP."
            )
        }), 400

    if otp != stored_otp["otp"]:

        return jsonify({
            "message": "Invalid OTP."
        }), 400

    # Mark email as verified for password reset

    reset_verified.add(email)

    # Remove OTP after successful verification

    del otp_store[email]

    return jsonify({
        "message": (
            "OTP verified successfully."
        )
    }), 200


# ============================================================
# RESET PASSWORD
# ============================================================

@app.route(
    "/reset-password",
    methods=["POST"]
)
def reset_password():

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Invalid request."
        }), 400

    email = data.get(
        "email",
        ""
    ).strip().lower()

    new_password = data.get(
        "newPassword",
        ""
    )

    if not email or not new_password:

        return jsonify({
            "message": (
                "Email and new password are required."
            )
        }), 400

    # OTP must be verified first

    if email not in reset_verified:

        return jsonify({
            "message": (
                "Please verify your OTP first."
            )
        }), 400

    if len(new_password) < 6:

        return jsonify({
            "message": (
                "Password must be at least "
                "6 characters long."
            )
        }), 400

    # Hash new password

    password_hash = generate_password_hash(
        new_password
    )

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute(
        """
        UPDATE users
        SET password_hash = %s
        WHERE email = %s
        """,
        (
            password_hash,
            email
        )
    )

    db.commit()

    rows_updated = cursor.rowcount

    cursor.close()
    db.close()

    if rows_updated == 0:

        reset_verified.discard(email)

        return jsonify({
            "message": "User account not found."
        }), 404

    # Reset process completed

    reset_verified.remove(email)

    return jsonify({
        "message": (
            "Password changed successfully."
        )
    }), 200


# ============================================================
# ANNOUNCEMENTS - GET
# ============================================================

@app.route(
    "/announcements",
    methods=["GET"]
)
def get_announcements():

    db = get_db_connection()
    cursor = db.cursor(
        dictionary=True
    )

    cursor.execute(
        """
        SELECT
            id,
            title,
            content,
            created_at
        FROM announcements
        ORDER BY created_at DESC
        """
    )

    announcements = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify({
        "announcements": announcements
    }), 200


# ============================================================
# ANNOUNCEMENTS - POST
# ============================================================

@app.route(
    "/announcements",
    methods=["POST"]
)
def create_announcement():

    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Invalid request."
        }), 400

    title = data.get(
        "title",
        ""
    ).strip()

    content = data.get(
        "content",
        ""
    ).strip()

    if not title or not content:

        return jsonify({
            "message": (
                "Title and content are required."
            )
        }), 400

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO announcements
        (
            title,
            content
        )
        VALUES (%s, %s)
        """,
        (
            title,
            content
        )
    )

    db.commit()

    cursor.close()
    db.close()

    return jsonify({
        "message": (
            "Announcement posted successfully."
        )
    }), 201


# ============================================================
# FORUM POSTS - GET
# ============================================================

@app.route(
    "/forum/posts",
    methods=["GET"]
)
def get_forum_posts():

    db = get_db_connection()
    cursor = db.cursor(
        dictionary=True
    )

    cursor.execute(
        """
        SELECT
            forum_posts.id,
            forum_posts.title,
            forum_posts.content,
            forum_posts.created_at,
            users.name AS user_name,
            forum_posts.file_name,
            forum_posts.file_path,
            forum_posts.file_type
        FROM forum_posts
        JOIN users
            ON forum_posts.user_id = users.id
        ORDER BY forum_posts.created_at DESC
        """
    )

    posts = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify({
        "posts": posts
    }), 200


# ============================================================
# FORUM POSTS - CREATE
# ============================================================

@app.route(
    "/forum/posts",
    methods=["POST"]
)
def create_forum_post():

    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    # FormData is used because a file can be included

    title = request.form.get(
        "title",
        ""
    ).strip()

    content = request.form.get(
        "content",
        ""
    ).strip()

    if not title or not content:

        return jsonify({
            "message": (
                "Title and content are required."
            )
        }), 400

    file = request.files.get("file")

    file_name = None
    file_path = None
    file_type = None

    # Handle optional attachment

    if file and file.filename:

        if not allowed_file(
            file.filename
        ):

            return jsonify({
                "message": (
                    "Only PNG, JPG, JPEG, PDF, "
                    "DOC and DOCX files are allowed."
                )
            }), 400

        original_name = secure_filename(
            file.filename
        )

        if not original_name:

            return jsonify({
                "message": "Invalid file name."
            }), 400

        unique_name = (

            str(session["user_id"])

            + "_"

            + str(
                int(time.time())
            )

            + "_"

            + original_name
        )

        file.save(
            os.path.join(
                app.config["UPLOAD_FOLDER"],
                unique_name
            )
        )

        file_name = original_name
        file_path = unique_name
        file_type = file.content_type

    # Save post information in MySQL

    db = get_db_connection()
    cursor = db.cursor()

    cursor.execute(
        """
        INSERT INTO forum_posts
        (
            user_id,
            title,
            content,
            file_name,
            file_path,
            file_type
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            session["user_id"],
            title,
            content,
            file_name,
            file_path,
            file_type
        )
    )

    db.commit()

    cursor.close()
    db.close()

    return jsonify({
        "message": (
            "Forum post created successfully."
        )
    }), 201


# ============================================================
# SERVE FORUM FILES
# ============================================================

@app.route(
    "/forum/files/<path:filename>",
    methods=["GET"]
)
def get_forum_file(filename):

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename
    )


# ============================================================
# FORUM REPLIES - GET
# ============================================================

@app.route(
    "/forum/posts/<int:post_id>/replies",
    methods=["GET"]
)
def get_forum_replies(post_id):

    db = get_db_connection()
    cursor = db.cursor(
        dictionary=True
    )

    cursor.execute(
        """
        SELECT
            forum_replies.id,
            forum_replies.content,
            forum_replies.created_at,
            users.name AS user_name,
            forum_replies.file_name,
            forum_replies.file_path,
            forum_replies.file_type
        FROM forum_replies
        JOIN users
            ON forum_replies.user_id = users.id
        WHERE forum_replies.post_id = %s
        ORDER BY forum_replies.created_at ASC
        """,
        (post_id,)
    )

    replies = cursor.fetchall()

    cursor.close()
    db.close()

    return jsonify({
        "replies": replies
    }), 200


# ============================================================
# FORUM REPLIES - CREATE
# ============================================================

@app.route(
    "/forum/posts/<int:post_id>/replies",
    methods=["POST"]
)
def create_forum_reply(post_id):

    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    content = request.form.get(
        "content",
        ""
    ).strip()

    if not content:

        return jsonify({
            "message": "Reply cannot be empty."
        }), 400

    db = get_db_connection()
    cursor = db.cursor()

    # Check whether post exists

    cursor.execute(
        """
        SELECT id
        FROM forum_posts
        WHERE id = %s
        """,
        (post_id,)
    )

    post = cursor.fetchone()

    if not post:

        cursor.close()
        db.close()

        return jsonify({
            "message": "Forum post not found."
        }), 404

    file = request.files.get("file")

    file_name = None
    file_path = None
    file_type = None

    # Handle optional reply attachment

    if file and file.filename:

        if not allowed_file(
            file.filename
        ):

            cursor.close()
            db.close()

            return jsonify({
                "message": (
                    "Only PNG, JPG, JPEG, PDF, "
                    "DOC and DOCX files are allowed."
                )
            }), 400

        original_name = secure_filename(
            file.filename
        )

        if not original_name:

            cursor.close()
            db.close()

            return jsonify({
                "message": "Invalid file name."
            }), 400

        unique_name = (

            str(session["user_id"])

            + "_reply_"

            + str(
                int(time.time())
            )

            + "_"

            + original_name
        )

        file.save(
            os.path.join(
                app.config["UPLOAD_FOLDER"],
                unique_name
            )
        )

        file_name = original_name
        file_path = unique_name
        file_type = file.content_type

    # Save reply in MySQL

    cursor.execute(
        """
        INSERT INTO forum_replies
        (
            post_id,
            user_id,
            content,
            file_name,
            file_path,
            file_type
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            post_id,
            session["user_id"],
            content,
            file_name,
            file_path,
            file_type
        )
    )

    db.commit()

    cursor.close()
    db.close()

    return jsonify({
        "message": (
            "Reply posted successfully."
        )
    }), 201


# ============================================================
# SERVER START
# ============================================================

if __name__ == "__main__":

    print("--------------------------------")
    print("Campus Connect Python Backend")
    print("--------------------------------")

    if EMAIL_USER:

        print(
            "EMAIL_USER loaded:",
            EMAIL_USER
        )

    else:

        print(
            "ERROR: EMAIL_USER not found"
        )

    if EMAIL_PASS:

        print(
            "EMAIL_PASS loaded: YES"
        )

    else:

        print(
            "ERROR: EMAIL_PASS not found"
        )

    print("--------------------------------")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )