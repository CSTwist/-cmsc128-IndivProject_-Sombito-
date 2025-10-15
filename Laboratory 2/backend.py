from flask import Flask, jsonify, redirect, url_for, render_template, request, session, flash
from datetime import timedelta, datetime, UTC
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = "your_secret_key"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///accounts.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.permanent_session_lifetime = timedelta(days=5)

db = SQLAlchemy(app)

class Accounts(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nameOfUser = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=True)
    password = db.Column(db.String(100), nullable=True)

    def __init__(self, nameOfUser, username, email, password):
        self.nameOfUser = nameOfUser
        self.username = username
        self.email = email
        self.password = password

@app.route("/")
def home():
    if "user" in session:     
        return render_template("profile.html")
    else:
        flash("You are not logged in!", "danger")
        return redirect(url_for("login"))

@app.route("/profile")
def profile():
    if "user" in session:     
        return render_template("profile.html", user=session["user"])
    else:
        flash("You are not logged in!", "danger")
        return redirect(url_for("login"))

@app.route("/login", methods=["POST", "GET"])
def login():
    if request.method == "POST":
        session.permanent = True
        user = request.form["nm"]
        session["user"] = user
        
        found_user = Accounts.query.filter_by(nameOfUser=user).first()
        if found_user:
            session["email"] = found_user.email
        else:
            usr = Accounts(nameOfUser=user, username="", email="", password="")
            db.session.add(usr)
            db.session.commit()
        
        flash("Login Successful!", "info")
        return redirect(url_for("home"))
    else:
        if "user" in session:
            flash("Already Logged In!", "info")
            return redirect(url_for("home"))
        return render_template("login.html")

@app.route("/signup", methods=["POST","GET"])
def signup():
    email = None
    return render_template("signup.html", email=email)

# -------------------
# ACCOUNT MANAGEMENT
# -------------------

@app.route("/add_account", methods=["POST"])
def add_account():
    if request.is_json:
        data = request.get_json()
        nameOfUser = data.get("nameOfUser")
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        new_account = Accounts(nameOfUser=nameOfUser, username=username, email=email, password=password)
        db.session.add(new_account)
        db.session.commit()

        return redirect(url_for("login"))
    else:
        return jsonify({"error": "Unsupported Media Type"}), 415


@app.route("/accounts", methods=["GET"])
def get_accounts():
    accounts = Accounts.query.all()
    return jsonify([
        {
            "id": a.id,
            "nameOfUser": a.nameOfUser,
            "username": a.username,
            "email": a.email,
            "password": a.password
        } for a in accounts
    ])


@app.route("/delete_account/<int:account_id>", methods=["DELETE"])
def delete_account(account_id):
    account = Accounts.query.get(account_id)
    if account:
        db.session.delete(account)
        db.session.commit()
        return jsonify({"success": True, "message": "Account deleted"})
    return jsonify({"success": False, "message": "Account not found"}), 404


@app.route("/edit_account/<int:account_id>", methods=["PUT"])
def edit_account(account_id):
    account = Accounts.query.get(account_id)
    if not account:
        return jsonify({"success": False, "message": "Account not found"}), 404
    
    data = request.get_json()
    account.nameOfUser = data.get("nameOfUser", account.nameOfUser)
    account.username = data.get("username", account.username)
    account.email = data.get("email", account.email)
    account.password = data.get("password", account.password)

    db.session.commit()
    return jsonify({"success": True, "message": "Account updated"})

@app.route("/logout")
def logout():
    flash(f"You have been logged out!", "info")
    session.pop("user", None)
    session.pop("email", None)
    return redirect(url_for("login"))

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)