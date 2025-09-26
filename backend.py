from flask import Flask, jsonify, redirect, url_for, render_template, request, session, flash
from datetime import timedelta
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.secret_key = "your_secret_key"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///todo_app.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.permanent_session_lifetime = timedelta(days=5)

db = SQLAlchemy(app)

class users(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=True)

    def __init__(self, name, email):
        self.name = name
        self.email = email

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    deadline = db.Column(db.String(20), nullable=False)
    time = db.Column(db.String(10), nullable=False)

    def __init__(self, name, deadline, time):
        self.name = name
        self.deadline = deadline
        self.time = time
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "deadline": self.deadline,
            "time": self.time
        }

@app.route("/")
def home():
    if "user" in session:     
        return render_template("index.html")
    else:
        flash("You are not logged in!", "danger")
        return redirect(url_for("login"))

@app.route("/view")
def view():
    return render_template("view.html", values=users.query.all())

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
        
        found_user = users.query.filter_by(name=user).first()
        if found_user:
            session["email"] = found_user.email
            
        else:
            usr = users(user, "")
            db.session.add(usr)
            db.session.commit()
        
        flash("Login Successful!", "info")
        return redirect(url_for("home"))
    else:
        if "user" in session:
            flash("Already Logged In!", "info")
            return redirect(url_for("user"))
        return render_template("login.html")
 
@app.route("/user", methods=["POST","GET"])
def user():
    email = None
    if "user" in session:
        user = session["user"]
        
        if request.method == "POST":
                email = request.form["email"]
                session["email"] = email
                found_user = users.query.filter_by(name=user).first()
                found_user.email = email
                db.session.commit()
                flash("Email was saved!", "info")
        else:
            if "email" in session:
                email = session["email"]        
        
        return render_template("user.html", email=email)
    else:
        flash("You are not logged in!", "danger")
        return redirect(url_for("login"))
    
@app.route("/add_task", methods=["POST"])
def add_task():
    if request.is_json:
        data = request.get_json()
        task_name = data.get("taskName")
        deadline = data.get("deadline")
        time = data.get("time")

        new_task = Task(name=task_name, deadline=deadline, time=time)
        db.session.add(new_task)
        db.session.commit()

        return jsonify({"success": True, "message": "Task added"})
    else:
        return jsonify({"error": "Unsupported Media Type"}), 415

@app.route("/tasks", methods=["GET"])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([task.to_dict() for task in tasks])

@app.route("/delete_task/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if task:
        db.session.delete(task)
        db.session.commit()
        return jsonify({"success": True, "message": "Task deleted"})
    return jsonify({"success": False, "message": "Task not found"}), 404

@app.route("/edit_task/<int:task_id>", methods=["PUT"])
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

    db.session.commit()
    return jsonify({"success": True, "message": "Task updated"})

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