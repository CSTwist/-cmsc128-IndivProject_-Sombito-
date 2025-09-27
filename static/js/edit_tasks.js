document.getElementById("editTaskForm").addEventListener("submit", async function (event) {
  event.preventDefault();

  const taskId = document.getElementById("editTaskId").value;
  const updatedTask = {
    taskName: document.getElementById("editTaskName").value,
    deadline: document.getElementById("editDeadline").value,
    time: document.getElementById("editTime").value,
  };

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
});