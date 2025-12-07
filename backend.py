import os
from threading import Thread
from flask import Flask, jsonify, redirect, url_for, render_template, request, session
from datetime import timedelta, datetime, UTC
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
import random
import string

# -------------------- FLASK SETUP --------------------
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "default_dev_key")

# -------------------- DATABASE CONFIGURATION --------------------
turso_db_url = os.environ.get("TURSO_DATABASE_URL")
turso_auth_token = os.environ.get("TURSO_AUTH_TOKEN")

if turso_db_url and turso_auth_token:

    if turso_db_url.startswith("libsql://"):
        turso_db_url = turso_db_url.replace("libsql://", "sqlite+libsql://")
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f"{turso_db_url}?secure=true"
    
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        "connect_args": {
            "auth_token": turso_auth_token,
            "check_same_thread": False 
        }
    }
    
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todo_app.sqlite3'

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.permanent_session_lifetime = timedelta(days=5)

db = SQLAlchemy(app)

# -------------------- FLASK MAIL SETUP --------------------
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'cnsombito@up.edu.ph'      
app.config['MAIL_PASSWORD'] = 'qnun jaik iuvo qrsf'         # Gmail App Password
app.config['MAIL_DEFAULT_SENDER'] = ('LeafList', 'cnsombito@up.edu.ph')

mail = Mail(app)

# -------------------- DATABASE MODEL --------------------
class List(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('accounts.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  
    tasks = db.relationship('Task', backref='list', cascade="all, delete-orphan")

    def __init__(self, owner_id, name, type):
        self.owner_id = owner_id
        self.name = name
        self.type = type
        
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    list_id = db.Column(db.Integer, db.ForeignKey('list.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    deadline = db.Column(db.String(20), nullable=False)   # deadline date
    time = db.Column(db.String(10), nullable=False)       # deadline time
    created_at = db.Column(db.String(10), nullable=False) # time task was created
    priority = db.Column(db.String(10), nullable=False)   # task priority

    def __init__(self, list_id, name, deadline, time, created_at, priority):
        self.list_id = list_id
        self.name = name
        self.deadline = deadline
        self.time = time
        self.created_at = created_at
        self.priority = priority
    
    def to_dict(self):
        return {
            "list_id": self.list_id,
            "id": self.id,
            "name": self.name,
            "deadline": self.deadline,
            "time": self.time,
            "created_at": self.created_at,
            "priority": self.priority
        }
        
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

# -------------------- HELPER FUNCTIONS --------------------
def send_async_email(app, msg):
    with app.app_context():
        try:
            mail.send(msg)
            print("Email sent successfully!")
        except Exception as e:
            print(f"Failed to send email: {e}")
            
# -------------------- ROUTES --------------------
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.route("/")
def home():
    if "user" in session:     
        return render_template("index.html")
    else:
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

    session["user"] = name
    session["email"] = email
    session["username"] = username
            
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
        if name:
            found_user = Accounts.query.filter_by(username=name).first()

        if found_user and check_password_hash(found_user.password, password):
            session["user"] = found_user.nameOfUser
            session["email"] = found_user.email
            session["username"] = found_user.username
            session["user_id"] = found_user.id
            session["list_id"] = List.query.filter_by(owner_id=found_user.id).first().id if List.query.filter_by(owner_id=found_user.id).first() else None
            session["list_name"] = List.query.filter_by(owner_id=found_user.id).first().name if List.query.filter_by(owner_id=found_user.id).first() else None
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

    # Prepare the message
    msg = Message(
        subject="LeafList Password Recovery",
        recipients=[email],
        body=f"Hello {account.nameOfUser},\n\nYour temporary password is: {temp_password}\nPlease log in and change it immediately."
    )

    Thread(target=send_async_email, args=(app, msg)).start()

    return jsonify({"success": True, "message": "Recovery email is being sent."})

# -------------------- TASK ACTIONS --------------------    
@app.route("/add_task", methods=["POST"]) #ADD TASKS
def add_task():
    if request.is_json:
        data = request.get_json()
        current_List = session["list_id"]
        task_name = data.get("taskName")
        deadline = data.get("deadline")
        time = data.get("time")
        created_at = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S")

        priority = data.get("priority")
        if not priority:
            return jsonify({"success": False, "message": "Priority is required"}), 400

        new_task = Task(list_id=current_List, name=task_name, deadline=deadline, time=time, created_at=created_at, priority=priority)
        db.session.add(new_task)
        db.session.commit()

        return redirect(url_for("home"))
    else:
        return jsonify({"error": "Unsupported Media Type"}), 415

@app.route("/tasks", methods=["GET"]) #GET TASKS
def get_tasks():
    tasks = Task.query.filter_by(list_id=session["list_id"]).all()
    return jsonify([task.to_dict() for task in tasks])

@app.route("/delete_task/<int:task_id>", methods=["DELETE"]) #DELETE TASKS
def delete_task(task_id):
    task = Task.query.get(task_id)
    if task:
        db.session.delete(task)
        db.session.commit()
        return jsonify({"success": True, "message": "Task deleted"})
    return jsonify({"success": False, "message": "Task not found"}), 404

@app.route("/edit_task/<int:task_id>", methods=["PUT"]) #EDIT TASKS
def edit_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"success": False, "message": "Task not found"}), 404
    
    print("EDIT CALLED for ID:", task_id)
    data = request.get_json()
    print("DATA RECEIVED:", data)
    task.name = data.get("taskName", task.name)
    task.deadline = data.get("deadline", task.deadline)
    task.time = data.get("time", task.time)
    task.priority = data.get("priority", task.priority)

    db.session.commit()
    return jsonify({"success": True, "message": "Task updated"})

# -------------------- LOGOUT --------------------
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))

# -------------------- LIST ACTIONS --------------------
@app.route("/add_list", methods=["POST"])
def add_list():
    if "user_id" not in session:
        return jsonify({"success": False, "message": "User not logged in"}), 401

    data = request.get_json() or {}
    name = data.get("name")
    type_ = data.get("type", "personal")

    if not name:
        return jsonify({"success": False, "message": "List name is required"}), 400

    owner_id = session["user_id"]
    new_list = List(owner_id=owner_id, name=name, type=type_)
    db.session.add(new_list)
    db.session.commit()
    session["list_id"] = new_list.id
    session["list_name"] = new_list.name

    return jsonify({"success": True, "message": "List added successfully", "id": new_list.id})

@app.route("/delete_list/<int:list_id>", methods=["DELETE"])
def delete_list(list_id):
    list_item = List.query.get(list_id)
    if list_item:
        db.session.delete(list_item)
        db.session.commit()
        
        first_list = List.query.filter_by(owner_id=session['user_id']).order_by(List.id).first()
    
        if first_list:
            session['list_id'] = first_list.id
            session['list_name'] = first_list.name
            new_list_data = {"id": first_list.id, "name": first_list.name}
        else:
            session['list_id'] = None
            session['list_name'] = None
            new_list_data = None

        return jsonify({"success": True, "new_list": new_list_data})
    return jsonify({"success": False, "message": "List not found"}), 404

@app.route("/lists", methods=["GET"]) #Get Lists of user
def get_lists():
    if "user_id" not in session:
        return jsonify([])

    user_id = session["user_id"]
    user_lists = List.query.filter_by(owner_id=user_id).all()
    return jsonify([{"id": l.id, "name": l.name, "type": l.type} for l in user_lists])

@app.route("/set_current_list", methods=["POST"])
def set_current_list():
    data = request.get_json()
    list_id = data.get("list_id")
    list_name = data.get("list_name")

    if not list_id or not list_name:
        return jsonify({"success": False, "message": "Missing list information"}), 400

    session["list_id"] = list_id
    session["list_name"] = list_name

    return jsonify({"success": True})

@app.route("/init_data")
def init_data():
    with app.app_context():
        db.create_all()
    
if __name__ == "__main__":
    app.run(debug=True)