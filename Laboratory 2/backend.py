from flask import Flask, jsonify, redirect, url_for, render_template, request, session
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
import re
import random
import string

# -------------------- FLASK SETUP --------------------
app = Flask(__name__)
app.secret_key = "your_secret_key"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///accounts.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.permanent_session_lifetime = timedelta(days=5)

db = SQLAlchemy(app)

# -------------------- FLASK MAIL SETUP --------------------
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'cnsombito@up.edu.ph'      # Your Gmail
app.config['MAIL_PASSWORD'] = 'qnun jaik iuvo qrsf'         # Gmail App Password
app.config['MAIL_DEFAULT_SENDER'] = ('LeafList', 'cnsombito@up.edu.ph')

mail = Mail(app)

# -------------------- DATABASE MODEL --------------------
class Accounts(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nameOfUser = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=True)
    password = db.Column(db.String(200), nullable=True)

    def __init__(self, nameOfUser, username, email, password):
        self.nameOfUser = nameOfUser
        self.username = username
        self.email = email
        self.password = password

# -------------------- ROUTES --------------------
@app.route("/")
def home():
    if "user" in session:
        return redirect(url_for("profile"))
    return redirect(url_for("login"))

@app.route("/profile")
def profile():
    if "user" not in session:
        return redirect(url_for("login"))
    return render_template(
        "profile.html",
        user=session.get("user"),
        email=session.get("email"),
        username=session.get("username")
    )
# -------------------- EDIT ACCOUNT --------------------
@app.route("/edit_account/<int:account_id>", methods=["PUT"])
def edit_account(account_id):
    data = request.get_json() or {}
    account = Accounts.query.get(account_id)

    if not account:
        return jsonify({"success": False, "message": "Account not found."}), 404

    # Update account fields
    name = data.get("nameOfUser", "").strip()
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "").strip()

    if not all([name, username, email]):
        return jsonify({"success": False, "message": "Name, username, and email cannot be empty."}), 400

    account.nameOfUser = name
    account.username = username
    account.email = email

    if password:
        account.password = generate_password_hash(password)

    db.session.commit()
    return jsonify({"success": True, "message": "Account updated successfully."})

# -------------------- LOGIN --------------------
@app.route("/login", methods=["POST", "GET"])
def login():
    message = ""
    if request.method == "POST":
        session.permanent = True
        name = request.form.get("nm", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "").strip()

        if not name or not password:
            message = "Please fill in your name and password."
            return render_template("login.html", message=message)

        # Find user by email or username
        found_user = None
        if email:
            found_user = Accounts.query.filter_by(email=email).first()
        if not found_user:
            found_user = Accounts.query.filter_by(username=name).first()

        if found_user and check_password_hash(found_user.password, password):
            session["user"] = found_user.nameOfUser
            session["email"] = found_user.email
            session["username"] = found_user.username
            session["user_id"] = found_user.id
            return redirect(url_for("profile"))

        message = "Invalid username/email or password."
        return render_template("login.html", message=message)

    if "user" in session:
        return redirect(url_for("profile"))
    return render_template("login.html")

# -------------------- SIGNUP --------------------
@app.route("/signup", methods=["POST", "GET"])
def signup():
    message = ""
    if request.method == "POST":
        if request.is_json:
            data = request.get_json()
            nameOfUser = data.get("nameOfUser", "").strip()
            username = data.get("username", "").strip()
            email = data.get("email", "").strip()
            password = data.get("password", "").strip()
        else:
            nameOfUser = request.form.get("nameOfUser", "").strip()
            username = request.form.get("username", "").strip()
            email = request.form.get("email", "").strip()
            password = request.form.get("password", "").strip()

        if not all([nameOfUser, username, email, password]):
            msg = "All fields are required to sign up."
            return jsonify({"success": False, "message": msg}) if request.is_json else render_template("signup.html", message=msg)

        if Accounts.query.filter_by(email=email).first():
            msg = "Email already registered. Please log in."
            return jsonify({"success": False, "message": msg}) if request.is_json else render_template("signup.html", message=msg)
        if Accounts.query.filter_by(username=username).first():
            msg = "Username already taken. Choose another."
            return jsonify({"success": False, "message": msg}) if request.is_json else render_template("signup.html", message=msg)

        hashed_password = generate_password_hash(password)
        new_account = Accounts(nameOfUser, username, email, hashed_password)
        db.session.add(new_account)
        db.session.commit()

        msg = "Account created successfully! Please log in."
        return jsonify({"success": True, "message": msg}) if request.is_json else render_template("login.html", message=msg)

    return render_template("signup.html", message=message)

# -------------------- PASSWORD RECOVERY --------------------
@app.route("/password_recovery", methods=["POST"])
def password_recovery():
    data = request.get_json() or {}
    email = data.get("email", "").strip()

    if not email:
        return jsonify({"success": False, "message": "Please enter your email."})

    account = Accounts.query.filter_by(email=email).first()
    if not account:
        return jsonify({"success": False, "message": "Email not found or error."})

    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
    account.password = generate_password_hash(temp_password)
    db.session.commit()

    try:
        msg = Message(
            subject="LeafList Password Recovery",
            recipients=[email],
            body=f"Hello {account.nameOfUser},\n\nYour temporary password is: {temp_password}\nPlease log in and change it immediately."
        )
        mail.send(msg)
        return jsonify({"success": True, "message": "Temporary password sent to your email."})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": "Failed to send email."})

# -------------------- LOGOUT --------------------
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

# -------------------- APP LAUNCH --------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
