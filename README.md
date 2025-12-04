Backend: Flask + SQLite
  We chose this backend due to it's simplicity

To run the Web application locally:
  To run our WebApp, run the backend.py in an IDE and then open http://127.0.0.1:5000/ in a browser

For deployment:
  Render hosting is used for deployment.
  Turso for external backend service.

To visit LeafList, click: https://cmsc128-indivproject-sombito.onrender.com/login

API Endpoints:
MultiAccounts API (Assignment 3):
  1) Add List
     - Takes a JSON with the To do list name and type -- either _personal_ or _shared_ for the current user.
  2) Delete List
     - Deletes the currently selected To do list of the user.

Accounts API (Assignment 2):
  1) Add Account
     - Takes a JSON with name of user, username, email, and password
  2) Edit Account
     - Updates the account of the user
  3) Delete Account
     - Deletes the account of the user

Tasks API (Assignment 1): 
  1) Add task
     -Takes a JSON with taskName, deadline, time, and priority
  3) Edit task
     -Updates the specified task
  5) Delete Task
     -Deletes the specified task
  7) Get tasks
     -Returns a JSON array of all tasks
