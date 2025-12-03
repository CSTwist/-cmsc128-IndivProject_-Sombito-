document.getElementById("editTaskForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const taskId = document.getElementById("editTaskId").value;

  // Get the selected priority from radio buttons
  const priorityRadio = document.querySelector('#editTaskForm input[name="priority"]:checked');
  const priority = priorityRadio ? priorityRadio.value : null;

  if (!priority) {
    alert("Please select a priority before saving.");
    return;
  }

  const updatedTask = {
    taskName: document.getElementById("editTaskName").value.trim(),
    deadline: document.getElementById("editDeadline").value,
    time: document.getElementById("editTime").value,
    priority: priority,
  };

  try {
    const response = await fetch(`/edit_task/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedTask),
    });

    const data = await response.json();

    if (data.success) {
      const modalElement = document.getElementById("editTaskModal");
      const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
      modal.hide();
      loadTasks();
    } else {
      alert("Failed to update task: " + data.message);
    }
  } catch (error) {
    console.error("Error updating task:", error);
    alert("An error occurred while updating the task.");
  }
});