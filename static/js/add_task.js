document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addTaskForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // stop normal form POST

    // Grab input values
    const taskName = document.getElementById("taskName").value;
    const deadline = document.getElementById("deadline").value;
    const time = document.getElementById("time").value;

    // Send to Flask backend as JSON
    const response = await fetch("/add_task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        taskName,
        deadline,
        time
      })
    });

    if (response.ok) {
        console.log("Task added successfully!");
        loadTasks(); // refresh tasks dynamically
        form.reset(); // clear modal inputs
        const modal = bootstrap.Modal.getInstance(document.getElementById("addTaskModal"));
        modal.hide(); // close modal
    } else {
        console.error("Error adding task.");
    }
  });
});