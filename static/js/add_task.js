document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addTaskForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // stop normal form POST

    // Grab input values
    const taskName = document.getElementById("taskName").value;
    const deadline = document.getElementById("deadline").value;
    const deadlineTime = document.getElementById("time").value;
    const priority = document.querySelector('input[name="priority"]:checked').value;

    // Generate current time (HH:MM)
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const createdAt = `${hours}:${minutes}`;

    // Send to Flask backend as JSON
    const response = await fetch("/add_task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currentList,
        taskName,
        deadline,
        time: deadlineTime,  // user deadline
        createdAt: createdAt, // extra current time field
        priority: priority // task priority
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
