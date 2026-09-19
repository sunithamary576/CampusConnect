from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

import mysql.connector
import smtplib
import os
import random
import time

from email.message import EmailMessage


# =========================
# BASIC SETUP
# =========================

load_dotenv()

app = Flask(__name__)

app.secret_key = os.getenv(
    "FLASK_SECRET_KEY",
    "campusconnect-secret-key"
)

CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:3000"]
)


# =========================
# DATABASE CONFIGURATION
# =========================

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "campusconnect")


def get_db_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )


# =========================
# EMAIL CONFIGURATION
# =========================

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")


print("Campus Connect Python Backend")
print("EMAIL_USER loaded:", EMAIL_USER)
print(
    "EMAIL_PASS loaded:",
    "YES" if EMAIL_PASS else "NO"
)


# =========================
# OTP STORAGE
# =========================

pending_registrations = {}
otp_store = {}
reset_verified = {}


# =========================
# FILE UPLOAD CONFIGURATION
# =========================

UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "uploads"
)

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 3 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "pdf",
    "doc",
    "docx"
}


def allowed_file(filename):
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


# =========================
# SEND EMAIL
# =========================

def send_email(to_email, subject, body):

    if not EMAIL_USER or not EMAIL_PASS:
        print("Email configuration missing.")
        return False

    try:
        message = EmailMessage()

        message["Subject"] = subject
        message["From"] = EMAIL_USER
        message["To"] = to_email

        message.set_content(body)

        with smtplib.SMTP(
            "smtp.gmail.com",
            587
        ) as server:

            server.starttls()

            server.login(
                EMAIL_USER,
                EMAIL_PASS
            )

            server.send_message(message)

        return True

    except smtplib.SMTPAuthenticationError:
        print("Gmail authentication failed.")
        return False

    except Exception as error:
        print("Email error:", error)
        return False


# =========================
# REGISTRATION
# =========================

@app.route("/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Invalid request."
        }), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    usn = data.get("usn", "").strip().upper()
    department = data.get("department", "").strip()
    year = data.get("year")
    password = data.get("password", "")

    if not all([
        name,
        email,
        usn,
        department,
        year,
        password
    ]):
        return jsonify({
            "message": "All fields are required."
        }), 400

    if not email.endswith("@cmrit.ac.in"):
        return jsonify({
            "message": "Please use your CMRIT college email."
        }), 400

    try:
        year = int(year)
    except (TypeError, ValueError):
        return jsonify({
            "message": "Invalid year."
        }), 400

    if len(password) < 6:
        return jsonify({
            "message": "Password must contain at least 6 characters."
        }), 400

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, email, usn
            FROM users
            WHERE email = %s OR usn = %s
        """, (
            email,
            usn
        ))

        existing_user = cursor.fetchone()

        cursor.close()
        db.close()

        if existing_user:

            if existing_user["email"] == email:
                return jsonify({
                    "message": "Email is already registered."
                }), 409

            if existing_user["usn"] == usn:
                return jsonify({
                    "message": "USN is already registered."
                }), 409

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

        email_sent = send_email(
            email,
            "Campus Connect Registration OTP",
            f"""
Hello {name},

Your Campus Connect registration OTP is:

{otp}

This OTP is valid for 5 minutes.

Do not share this OTP with anyone.

Campus Connect
"""
        )

        if not email_sent:
            pending_registrations.pop(email, None)

            return jsonify({
                "message": "Unable to send OTP. Please check email configuration."
            }), 500

        return jsonify({
            "message": "OTP sent successfully."
        }), 200

    except Exception as error:

        print("Register error:", error)

        return jsonify({
            "message": "Unable to register."
        }), 500


# =========================
# VERIFY REGISTRATION OTP
# =========================

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

    registration = pending_registrations.get(email)

    if not registration:
        return jsonify({
            "message": "Registration request not found."
        }), 404

    if time.time() > registration["expires_at"]:

        pending_registrations.pop(
            email,
            None
        )

        return jsonify({
            "message": "OTP has expired."
        }), 400

    if otp != registration["otp"]:
        return jsonify({
            "message": "Invalid OTP."
        }), 400

    try:

        db = get_db_connection()
        cursor = db.cursor()

        password_hash = generate_password_hash(
            registration["password"]
        )

        cursor.execute("""
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
            VALUES (%s, %s, %s, %s, %s, %s, TRUE)
        """, (
            registration["name"],
            registration["email"],
            registration["usn"],
            registration["department"],
            registration["year"],
            password_hash
        ))

        db.commit()

        cursor.close()
        db.close()

        pending_registrations.pop(
            email,
            None
        )

        return jsonify({
            "message": "Registration successful."
        }), 201

    except mysql.connector.IntegrityError:

        return jsonify({
            "message": "Email or USN is already registered."
        }), 409

    except Exception as error:

        print(
            "Registration verification error:",
            error
        )

        return jsonify({
            "message": "Unable to complete registration."
        }), 500


# =========================
# LOGIN
# =========================

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
            "message": "Email and password are required."
        }), 400

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                name,
                email,
                usn,
                department,
                year,
                password_hash,
                is_verified
            FROM users
            WHERE email = %s
        """, (
            email,
        ))

        user = cursor.fetchone()

        cursor.close()
        db.close()

        if not user:

            return jsonify({
                "message": "Invalid email or password."
            }), 401

        if not user["is_verified"]:

            return jsonify({
                "message": "Please verify your account first."
            }), 403

        if not check_password_hash(
            user["password_hash"],
            password
        ):

            return jsonify({
                "message": "Invalid email or password."
            }), 401

        session["user_id"] = user["id"]

        return jsonify({
            "message": "Login successful.",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "usn": user["usn"],
                "department": user["department"],
                "year": user["year"]
            }
        }), 200

    except Exception as error:

        print("Login error:", error)

        return jsonify({
            "message": "Unable to login."
        }), 500


# =========================
# CURRENT USER
# =========================

@app.route("/me", methods=["GET"])
def current_user():

    if "user_id" not in session:
        return jsonify({
            "message": "Not logged in."
        }), 401

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                name,
                email,
                usn,
                department,
                year
            FROM users
            WHERE id = %s
        """, (
            session["user_id"],
        ))

        user = cursor.fetchone()

        cursor.close()
        db.close()

        if not user:

            session.clear()

            return jsonify({
                "message": "User not found."
            }), 401

        return jsonify({
            "user": user
        }), 200

    except Exception as error:

        print("ME error:", error)

        return jsonify({
            "message": "Unable to load user."
        }), 500


# =========================
# LOGOUT
# =========================

@app.route("/logout", methods=["POST"])
def logout():

    session.clear()

    return jsonify({
        "message": "Logged out successfully."
    }), 200


# =========================
# GENERIC OTP
# =========================

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
            "message": "Please use your CMRIT college email."
        }), 400

    otp = str(
        random.randint(
            100000,
            999999
        )
    )

    otp_store[email] = {
        "otp": otp,
        "expires_at": time.time() + 300
    }

    if not send_email(
        email,
        "Campus Connect OTP",
        f"""
Your Campus Connect OTP is:

{otp}

This OTP is valid for 5 minutes.
"""
    ):

        otp_store.pop(
            email,
            None
        )

        return jsonify({
            "message": "Unable to send OTP."
        }), 500

    return jsonify({
        "message": "OTP sent successfully."
    }), 200


# =========================
# VERIFY GENERIC OTP
# =========================

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

    stored = otp_store.get(email)

    if not stored:

        return jsonify({
            "message": "OTP not found."
        }), 404

    if time.time() > stored["expires_at"]:

        otp_store.pop(
            email,
            None
        )

        return jsonify({
            "message": "OTP has expired."
        }), 400

    if otp != stored["otp"]:

        return jsonify({
            "message": "Invalid OTP."
        }), 400

    otp_store.pop(
        email,
        None
    )

    return jsonify({
        "message": "OTP verified successfully."
    }), 200


# =========================
# FORGOT PASSWORD
# =========================

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

    if not email.endswith("@cmrit.ac.in"):
        return jsonify({
            "message": "Please use your CMRIT college email."
        }), 400

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT id
            FROM users
            WHERE email = %s
              AND is_verified = TRUE
        """, (
            email,
        ))

        user = cursor.fetchone()

        cursor.close()
        db.close()

        if not user:

            return jsonify({
                "message": "No verified account found with this email."
            }), 404

        otp = str(
            random.randint(
                100000,
                999999
            )
        )

        otp_store[email] = {
            "otp": otp,
            "expires_at": time.time() + 300
        }

        reset_verified.pop(
            email,
            None
        )

        if not send_email(
            email,
            "Campus Connect Password Reset OTP",
            f"""
Your Campus Connect password reset OTP is:

{otp}

This OTP is valid for 5 minutes.

If you did not request a password reset,
ignore this email.
"""
        ):

            otp_store.pop(
                email,
                None
            )

            return jsonify({
                "message": "Unable to send OTP."
            }), 500

        return jsonify({
            "message": "Password reset OTP sent successfully."
        }), 200

    except Exception as error:

        print(
            "Send reset OTP error:",
            error
        )

        return jsonify({
            "message": "Unable to send reset OTP."
        }), 500


# =========================
# VERIFY RESET OTP
# =========================

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

    stored = otp_store.get(email)

    if not stored:

        return jsonify({
            "message": "OTP not found."
        }), 404

    if time.time() > stored["expires_at"]:

        otp_store.pop(
            email,
            None
        )

        return jsonify({
            "message": "OTP has expired."
        }), 400

    if otp != stored["otp"]:

        return jsonify({
            "message": "Invalid OTP."
        }), 400

    otp_store.pop(
        email,
        None
    )

    reset_verified[email] = {
        "expires_at": time.time() + 600
    }

    return jsonify({
        "message": "OTP verified successfully."
    }), 200


# =========================
# RESET PASSWORD
# =========================

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
            "message": "Email and new password are required."
        }), 400

    if len(new_password) < 6:

        return jsonify({
            "message": "Password must contain at least 6 characters."
        }), 400

    verified = reset_verified.get(email)

    if not verified:

        return jsonify({
            "message": "Please verify the OTP first."
        }), 403

    if time.time() > verified["expires_at"]:

        reset_verified.pop(
            email,
            None
        )

        return jsonify({
            "message": "Password reset session has expired."
        }), 403

    try:

        password_hash = generate_password_hash(
            new_password
        )

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            UPDATE users
            SET password_hash = %s
            WHERE email = %s
        """, (
            password_hash,
            email
        ))

        db.commit()

        if cursor.rowcount == 0:

            cursor.close()
            db.close()

            return jsonify({
                "message": "User not found."
            }), 404

        cursor.close()
        db.close()

        reset_verified.pop(
            email,
            None
        )

        return jsonify({
            "message": "Password changed successfully."
        }), 200

    except Exception as error:

        print(
            "Reset password error:",
            error
        )

        return jsonify({
            "message": "Unable to reset password."
        }), 500


# =========================
# ANNOUNCEMENTS
# =========================

@app.route(
    "/announcements",
    methods=["GET"]
)
def get_announcements():

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                title,
                content,
                created_at
            FROM announcements
            ORDER BY created_at DESC
        """)

        announcements = cursor.fetchall()

        for announcement in announcements:

            if announcement["created_at"]:

                announcement["created_at"] = (
                    announcement["created_at"].isoformat()
                )

        cursor.close()
        db.close()

        return jsonify({
            "announcements": announcements
        }), 200

    except Exception as error:

        print(
            "Announcements GET error:",
            error
        )

        return jsonify({
            "message": "Unable to load announcements."
        }), 500


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
            "message": "Title and content are required."
        }), 400

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO announcements
            (title, content)
            VALUES (%s, %s)
        """, (
            title,
            content
        ))

        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "message": "Announcement added successfully."
        }), 201

    except Exception as error:

        print(
            "Announcements POST error:",
            error
        )

        return jsonify({
            "message": "Unable to add announcement."
        }), 500


# =========================
# FORUM POSTS
# =========================

@app.route(
    "/forum/posts",
    methods=["GET"]
)
def get_forum_posts():

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                fp.id,
                fp.user_id,
                fp.title,
                fp.content,
                fp.file_name,
                fp.file_path,
                fp.file_type,
                fp.created_at,
                u.name AS user_name
            FROM forum_posts fp
            JOIN users u
                ON fp.user_id = u.id
            ORDER BY fp.created_at DESC
        """)

        posts = cursor.fetchall()

        for post in posts:

            if post["created_at"]:

                post["created_at"] = (
                    post["created_at"].isoformat()
                )

        cursor.close()
        db.close()

        return jsonify({
            "posts": posts
        }), 200

    except Exception as error:

        print(
            "Forum GET error:",
            error
        )

        return jsonify({
            "message": "Unable to load forum posts."
        }), 500


@app.route(
    "/forum/posts",
    methods=["POST"]
)
def create_forum_post():

    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    title = request.form.get(
        "title",
        ""
    ).strip()

    content = request.form.get(
        "content",
        ""
    ).strip()

    file = request.files.get("file")

    if not title or not content:

        return jsonify({
            "message": "Title and content are required."
        }), 400

    file_name = None
    file_path = None
    file_type = None

    try:

        if file and file.filename:

            if not allowed_file(file.filename):

                return jsonify({
                    "message": "Invalid file type."
                }), 400

            original_name = secure_filename(
                file.filename
            )

            unique_name = (
                f"{int(time.time())}_"
                f"{random.randint(1000, 9999)}_"
                f"{original_name}"
            )

            file.save(
                os.path.join(
                    app.config["UPLOAD_FOLDER"],
                    unique_name
                )
            )

            file_name = original_name
            file_path = unique_name

            extension = (
                original_name
                .rsplit(".", 1)[1]
                .lower()
            )

            file_type = extension

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
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
        """, (
            session["user_id"],
            title,
            content,
            file_name,
            file_path,
            file_type
        ))

        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "message": "Post created successfully."
        }), 201

    except Exception as error:

        print(
            "Forum POST error:",
            error
        )

        return jsonify({
            "message": "Unable to create post."
        }), 500


# =========================
# FORUM FILES
# =========================

@app.route(
    "/forum/files/<path:filename>"
)
def forum_file(filename):

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename
    )


# =========================
# FORUM REPLIES
# =========================

@app.route(
    "/forum/posts/<int:post_id>/replies",
    methods=["GET"]
)
def get_forum_replies(post_id):

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                fr.id,
                fr.post_id,
                fr.user_id,
                fr.content,
                fr.file_name,
                fr.file_path,
                fr.file_type,
                fr.created_at,
                u.name AS user_name
            FROM forum_replies fr
            JOIN users u
                ON fr.user_id = u.id
            WHERE fr.post_id = %s
            ORDER BY fr.created_at ASC
        """, (
            post_id,
        ))

        replies = cursor.fetchall()

        for reply in replies:

            if reply["created_at"]:

                reply["created_at"] = (
                    reply["created_at"].isoformat()
                )

        cursor.close()
        db.close()

        return jsonify({
            "replies": replies
        }), 200

    except Exception as error:

        print(
            "Forum replies GET error:",
            error
        )

        return jsonify({
            "message": "Unable to load replies."
        }), 500


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

    file = request.files.get("file")

    if not content:

        return jsonify({
            "message": "Reply content is required."
        }), 400

    file_name = None
    file_path = None
    file_type = None

    try:

        if file and file.filename:

            if not allowed_file(file.filename):

                return jsonify({
                    "message": "Invalid file type."
                }), 400

            original_name = secure_filename(
                file.filename
            )

            unique_name = (
                f"{int(time.time())}_"
                f"{random.randint(1000, 9999)}_"
                f"{original_name}"
            )

            file.save(
                os.path.join(
                    app.config["UPLOAD_FOLDER"],
                    unique_name
                )
            )

            file_name = original_name
            file_path = unique_name

            extension = (
                original_name
                .rsplit(".", 1)[1]
                .lower()
            )

            file_type = extension

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            SELECT id
            FROM forum_posts
            WHERE id = %s
        """, (
            post_id,
        ))

        post = cursor.fetchone()

        if not post:

            cursor.close()
            db.close()

            return jsonify({
                "message": "Post not found."
            }), 404

        cursor.execute("""
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
        """, (
            post_id,
            session["user_id"],
            content,
            file_name,
            file_path,
            file_type
        ))

        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "message": "Reply added successfully."
        }), 201

    except Exception as error:

        print(
            "Forum reply POST error:",
            error
        )

        return jsonify({
            "message": "Unable to add reply."
        }), 500


# =========================
# EVENTS
# =========================

@app.route(
    "/events",
    methods=["GET"]
)
def get_events():

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                title,
                description,
                event_date,
                event_time,
                venue,
                created_at
            FROM events
            ORDER BY event_date ASC, event_time ASC
        """)

        events = cursor.fetchall()

        for event in events:

            if event["event_date"]:

                event["event_date"] = (
                    event["event_date"].isoformat()
                )

            if event["event_time"]:

                event["event_time"] = str(
                    event["event_time"]
                )

            if event["created_at"]:

                event["created_at"] = (
                    event["created_at"].isoformat()
                )

        cursor.close()
        db.close()

        return jsonify({
            "events": events
        }), 200

    except Exception as error:

        print(
            "Events GET error:",
            error
        )

        return jsonify({
            "message": "Unable to load events."
        }), 500


@app.route(
    "/events",
    methods=["POST"]
)
def create_event():

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

    description = data.get(
        "description",
        ""
    ).strip()

    event_date = data.get(
        "event_date",
        ""
    ).strip()

    event_time = data.get(
        "event_time",
        ""
    ).strip()

    venue = data.get(
        "venue",
        ""
    ).strip()

    if not all([
        title,
        description,
        event_date,
        event_time,
        venue
    ]):

        return jsonify({
            "message": "All event fields are required."
        }), 400

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO events
            (
                title,
                description,
                event_date,
                event_time,
                venue
            )
            VALUES (%s, %s, %s, %s, %s)
        """, (
            title,
            description,
            event_date,
            event_time,
            venue
        ))

        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "message": "Event added successfully."
        }), 201

    except Exception as error:

        print(
            "Events POST error:",
            error
        )

        return jsonify({
            "message": "Unable to add event."
        }), 500


# =========================
# CLUBS
# =========================

@app.route(
    "/clubs",
    methods=["GET"]
)
def get_clubs():

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                name,
                description,
                created_at
            FROM clubs
            ORDER BY created_at DESC
        """)

        clubs = cursor.fetchall()

        for club in clubs:

            if club["created_at"]:

                club["created_at"] = (
                    club["created_at"].isoformat()
                )

        cursor.close()
        db.close()

        return jsonify({
            "clubs": clubs
        }), 200

    except Exception as error:

        print(
            "Clubs GET error:",
            error
        )

        return jsonify({
            "message": "Unable to load clubs."
        }), 500


@app.route(
    "/clubs",
    methods=["POST"]
)
def create_club():

    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Invalid request."
        }), 400

    name = data.get(
        "name",
        ""
    ).strip()

    description = data.get(
        "description",
        ""
    ).strip()

    if not name or not description:

        return jsonify({
            "message": "Club name and description are required."
        }), 400

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO clubs
            (name, description)
            VALUES (%s, %s)
        """, (
            name,
            description
        ))

        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "message": "Club added successfully."
        }), 201

    except Exception as error:

        print(
            "Clubs POST error:",
            error
        )

        return jsonify({
            "message": "Unable to add club."
        }), 500


@app.route(
    "/clubs/<int:club_id>",
    methods=["DELETE"]
)
def delete_club(club_id):

    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            DELETE FROM clubs
            WHERE id = %s
        """, (
            club_id,
        ))

        db.commit()

        if cursor.rowcount == 0:

            cursor.close()
            db.close()

            return jsonify({
                "message": "Club not found."
            }), 404

        cursor.close()
        db.close()

        return jsonify({
            "message": "Club deleted successfully."
        }), 200

    except Exception as error:

        print(
            "Clubs DELETE error:",
            error
        )

        return jsonify({
            "message": "Unable to delete club."
        }), 500


# =========================
# MARKETPLACE
# =========================

@app.route(
    "/market",
    methods=["GET"]
)
def get_market_items():

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                user_id,
                name,
                price,
                contact,
                image_name,
                image_path,
                created_at
            FROM market_items
            ORDER BY created_at DESC
        """)

        items = cursor.fetchall()

        for item in items:

            if item["created_at"]:

                item["created_at"] = (
                    item["created_at"].isoformat()
                )

            if item["price"] is not None:

                item["price"] = float(
                    item["price"]
                )

        cursor.close()
        db.close()

        return jsonify({
            "items": items
        }), 200

    except Exception as error:

        print(
            "Market GET error:",
            error
        )

        return jsonify({
            "message": "Unable to load marketplace."
        }), 500


@app.route(
    "/market",
    methods=["POST"]
)
def create_market_item():

    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    name = request.form.get(
        "name",
        ""
    ).strip()

    price = request.form.get(
        "price",
        ""
    ).strip()

    contact = request.form.get(
        "contact",
        ""
    ).strip()

    image = request.files.get("image")

    if not name or not price or not contact:

        return jsonify({
            "message": "Please fill all fields."
        }), 400

    try:

        price_value = float(price)

        if price_value < 0:

            return jsonify({
                "message": "Price cannot be negative."
            }), 400

    except ValueError:

        return jsonify({
            "message": "Please enter a valid price."
        }), 400

    image_name = None
    image_path = None

    try:

        db = get_db_connection()
        cursor = db.cursor()

        if image and image.filename:

            if not allowed_file(
                image.filename
            ):

                cursor.close()
                db.close()

                return jsonify({
                    "message": "Invalid image type."
                }), 400

            original_name = secure_filename(
                image.filename
            )

            unique_name = (
                f"{int(time.time())}_"
                f"{random.randint(1000, 9999)}_"
                f"{original_name}"
            )

            image.save(
                os.path.join(
                    app.config["UPLOAD_FOLDER"],
                    unique_name
                )
            )

            image_name = original_name
            image_path = unique_name

        cursor.execute("""
            INSERT INTO market_items
            (
                user_id,
                name,
                price,
                contact,
                image_name,
                image_path
            )
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            session["user_id"],
            name,
            price_value,
            contact,
            image_name,
            image_path
        ))

        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "message": "Item added successfully."
        }), 201

    except Exception as error:

        print(
            "Market POST error:",
            error
        )

        return jsonify({
            "message": "Unable to add item."
        }), 500


@app.route(
    "/market/files/<path:filename>"
)
def market_file(filename):

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename
    )


@app.route(
    "/market/<int:item_id>",
    methods=["DELETE"]
)
def delete_market_item(item_id):

    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT image_path
            FROM market_items
            WHERE id = %s
              AND user_id = %s
        """, (
            item_id,
            session["user_id"]
        ))

        item = cursor.fetchone()

        if not item:

            cursor.close()
            db.close()

            return jsonify({
                "message": "Item not found or you cannot delete it."
            }), 404

        cursor.execute("""
            DELETE FROM market_items
            WHERE id = %s
              AND user_id = %s
        """, (
            item_id,
            session["user_id"]
        ))

        db.commit()

        if item["image_path"]:

            file_path = os.path.join(
                app.config["UPLOAD_FOLDER"],
                item["image_path"]
            )

            if os.path.exists(file_path):

                os.remove(file_path)

        cursor.close()
        db.close()

        return jsonify({
            "message": "Item deleted successfully."
        }), 200

    except Exception as error:

        print(
            "Market DELETE error:",
            error
        )

        return jsonify({
            "message": "Unable to delete item."
        }), 500


@app.route(
    "/market/<int:item_id>",
    methods=["PUT"]
)
def update_market_item(item_id):

    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Invalid request."
        }), 400

    name = data.get(
        "name",
        ""
    ).strip()

    price = str(
        data.get(
            "price",
            ""
        )
    ).strip()

    if not name or not price:

        return jsonify({
            "message": "Item name and price are required."
        }), 400

    try:

        price_value = float(price)

        if price_value < 0:

            return jsonify({
                "message": "Price cannot be negative."
            }), 400

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            UPDATE market_items
            SET name = %s,
                price = %s
            WHERE id = %s
              AND user_id = %s
        """, (
            name,
            price_value,
            item_id,
            session["user_id"]
        ))

        db.commit()

        if cursor.rowcount == 0:

            cursor.close()
            db.close()

            return jsonify({
                "message": "Item not found or you cannot edit it."
            }), 404

        cursor.close()
        db.close()

        return jsonify({
            "message": "Item updated successfully."
        }), 200

    except ValueError:

        return jsonify({
            "message": "Please enter a valid price."
        }), 400

    except Exception as error:

        print(
            "Market UPDATE error:",
            error
        )

        return jsonify({
            "message": "Unable to update item."
        }), 500


# =========================
# POLLS
# =========================

@app.route(
    "/polls",
    methods=["GET"]
)
def get_polls():

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        user_id = session.get("user_id")

        cursor.execute("""
            SELECT
                p.id,
                p.question,
                p.created_at,
                o.id AS option_id,
                o.option_text,
                o.votes
            FROM polls p
            LEFT JOIN poll_options o
                ON p.id = o.poll_id
            ORDER BY p.created_at DESC,
                     o.id ASC
        """)

        rows = cursor.fetchall()

        polls = {}

        for row in rows:

            poll_id = row["id"]

            if poll_id not in polls:

                polls[poll_id] = {
                    "id": poll_id,
                    "question": row["question"],
                    "created_at": (
                        row["created_at"].isoformat()
                        if row["created_at"]
                        else None
                    ),
                    "options": [],
                    "has_voted": False
                }

            if row["option_id"] is not None:

                polls[poll_id]["options"].append({
                    "id": row["option_id"],
                    "option_text": row["option_text"],
                    "votes": row["votes"]
                })

        # ---------------------------------
        # CHECK WHETHER CURRENT USER VOTED
        # ---------------------------------

        if user_id:

            cursor.execute("""
                SELECT poll_id
                FROM poll_votes
                WHERE user_id = %s
            """, (
                user_id,
            ))

            voted_polls = cursor.fetchall()

            voted_poll_ids = {
                row["poll_id"]
                for row in voted_polls
            }

            for poll in polls.values():

                if poll["id"] in voted_poll_ids:

                    poll["has_voted"] = True

        cursor.close()
        db.close()

        return jsonify({
            "polls": list(polls.values())
        }), 200

    except Exception as error:

        print(
            "Polls GET error:",
            error
        )

        return jsonify({
            "message": "Unable to load polls."
        }), 500


# =========================
# CREATE POLL
# =========================

@app.route(
    "/polls",
    methods=["POST"]
)
def create_poll():

    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Invalid request."
        }), 400

    question = data.get(
        "question",
        ""
    ).strip()

    options = data.get(
        "options",
        []
    )

    if not question:

        return jsonify({
            "message": "Poll question is required."
        }), 400

    if not isinstance(
        options,
        list
    ):

        return jsonify({
            "message": "Options must be a list."
        }), 400

    options = [
        str(option).strip()
        for option in options
        if str(option).strip()
    ]

    if len(options) < 2:

        return jsonify({
            "message": "At least two options are required."
        }), 400

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            INSERT INTO polls
            (
                user_id,
                question
            )
            VALUES (%s, %s)
        """, (
            session["user_id"],
            question
        ))

        poll_id = cursor.lastrowid

        for option in options:

            cursor.execute("""
                INSERT INTO poll_options
                (
                    poll_id,
                    option_text,
                    votes
                )
                VALUES (%s, %s, 0)
            """, (
                poll_id,
                option
            ))

        db.commit()

        cursor.close()
        db.close()

        return jsonify({
            "message": "Poll created successfully."
        }), 201

    except Exception as error:

        print(
            "Polls POST error:",
            error
        )

        return jsonify({
            "message": "Unable to create poll."
        }), 500


# =========================
# VOTE IN POLL
# =========================

@app.route(
    "/polls/<int:poll_id>/vote/<int:option_id>",
    methods=["POST"]
)
def vote_poll(
    poll_id,
    option_id
):

    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    user_id = session["user_id"]

    db = None
    cursor = None

    try:

        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # ---------------------------------
        # CHECK IF USER ALREADY VOTED
        # ---------------------------------

        cursor.execute("""
            SELECT id
            FROM poll_votes
            WHERE poll_id = %s
              AND user_id = %s
        """, (
            poll_id,
            user_id
        ))

        existing_vote = cursor.fetchone()

        if existing_vote:

            return jsonify({
                "message": "You have already voted in this poll."
            }), 409

        # ---------------------------------
        # CHECK OPTION BELONGS TO POLL
        # ---------------------------------

        cursor.execute("""
            SELECT id
            FROM poll_options
            WHERE id = %s
              AND poll_id = %s
        """, (
            option_id,
            poll_id
        ))

        option = cursor.fetchone()

        if not option:

            return jsonify({
                "message": "Invalid poll option."
            }), 404

        # ---------------------------------
        # RECORD VOTE
        # ---------------------------------

        cursor.execute("""
            INSERT INTO poll_votes
            (
                poll_id,
                option_id,
                user_id
            )
            VALUES (%s, %s, %s)
        """, (
            poll_id,
            option_id,
            user_id
        ))

        # ---------------------------------
        # INCREASE VOTE COUNT
        # ---------------------------------

        cursor.execute("""
            UPDATE poll_options
            SET votes = votes + 1
            WHERE id = %s
        """, (
            option_id,
        ))

        db.commit()

        return jsonify({
            "message": "Vote recorded successfully."
        }), 200

    except mysql.connector.IntegrityError:

        if db:
            db.rollback()

        return jsonify({
            "message": "You have already voted in this poll."
        }), 409

    except Exception as error:

        if db:
            db.rollback()

        print(
            "Poll vote error:",
            error
        )

        return jsonify({
            "message": "Unable to record vote."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# =========================
# DELETE POLL
# =========================

@app.route(
    "/polls/<int:poll_id>",
    methods=["DELETE"]
)
def delete_poll(poll_id):

    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    try:

        db = get_db_connection()
        cursor = db.cursor()

        cursor.execute("""
            DELETE FROM polls
            WHERE id = %s
              AND user_id = %s
        """, (
            poll_id,
            session["user_id"]
        ))

        db.commit()

        if cursor.rowcount == 0:

            cursor.close()
            db.close()

            return jsonify({
                "message": "Poll not found or you cannot delete it."
            }), 404

        cursor.close()
        db.close()

        return jsonify({
            "message": "Poll deleted successfully."
        }), 200

    except Exception as error:

        print(
            "Poll DELETE error:",
            error
        )

        return jsonify({
            "message": "Unable to delete poll."
        }), 500


# =========================
# UPDATE POLL
# =========================

@app.route(
    "/polls/<int:poll_id>",
    methods=["PUT"]
)
def update_poll(poll_id):

    # Check login
    if "user_id" not in session:

        return jsonify({
            "message": "Please login first."
        }), 401

    # Get data from React
    data = request.get_json()

    if not data:

        return jsonify({
            "message": "Invalid request."
        }), 400

    # Get new question
    question = data.get(
        "question",
        ""
    ).strip()

    if not question:

        return jsonify({
            "message": "Poll question is required."
        }), 400

    db = None
    cursor = None

    try:

        # Connect to MySQL
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)

        # ---------------------------------
        # STEP 1: Check poll ownership
        # ---------------------------------

        cursor.execute("""
            SELECT id
            FROM polls
            WHERE id = %s
              AND user_id = %s
        """, (
            poll_id,
            session["user_id"]
        ))

        poll = cursor.fetchone()

        # Poll does not exist or user is not creator
        if not poll:

            return jsonify({
                "message": "Poll not found or you cannot edit it."
            }), 404

        # ---------------------------------
        # STEP 2: Update poll
        # ---------------------------------

        cursor.execute("""
            UPDATE polls
            SET question = %s
            WHERE id = %s
              AND user_id = %s
        """, (
            question,
            poll_id,
            session["user_id"]
        ))

        db.commit()

        # ---------------------------------
        # STEP 3: Success
        # ---------------------------------

        return jsonify({
            "message": "Poll updated successfully."
        }), 200

    except Exception as error:

        # Rollback if something goes wrong
        if db:
            db.rollback()

        print(
            "Poll UPDATE error:",
            error
        )

        return jsonify({
            "message": "Unable to update poll."
        }), 500

    finally:

        # Close database resources
        if cursor:
            cursor.close()

        if db:
            db.close()

# =========================
# ERROR HANDLER
# =========================

@app.errorhandler(413)
def file_too_large(error):

    return jsonify({
        "message": "File is too large. Maximum size is 3 MB."
    }), 413


# =========================
# START SERVER
# =========================

if __name__ == "__main__":

    print(
        "Campus Connect server starting..."
    )

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )