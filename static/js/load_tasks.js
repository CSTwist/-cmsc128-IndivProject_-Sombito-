async function loadTasks() {
  const response = await fetch("/tasks");
  if (!response.ok) {
    console.error("Failed to fetch tasks");
    return;
  }

  const tasks = await response.json();
  const container = document.getElementById("taskContainer");
  container.innerHTML = "";

  tasks.forEach(task => {
    const card = document.createElement("div");
    card.className = "card mb-3";

    card.innerHTML = `
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-1 text-center">
            <input class="checkbox form-check-input" type="checkbox">
          </div>
          <div class="task-name col-5">${task.name}</div>
          <div class="deadline col-3">${task.deadline} ${task.time}</div>
          <div class="actions col-2 text-center">
            <button class="edit-task btn btn-sm btn-outline-primary" 
                    data-id="${task.id}" 
                    data-name="${task.name}" 
                    data-deadline="${task.deadline}" 
                    data-time="${task.time}" 
                    title="Edit Task">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="delete-task btn btn-sm btn-outline-danger" data-id="${task.id}" title="Delete Task">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);

    // // Delete button handler
    // card.querySelector(".delete-task").addEventListener("click", async (e) => {
    //   const taskId = e.target.closest("button").getAttribute("data-id");
    //   if (!confirm("Are you sure you want to delete this task?")) return;

    //   const res = await fetch(`/delete_task/${taskId}`, { method: "DELETE" });
    //   const result = await res.json();
    //   if (result.success) loadTasks();
    //   else alert(result.message);
    // });

    // Edit button handler
    card.querySelector(".edit-task").addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      document.getElementById("editTaskId").value = btn.getAttribute("data-id");
      document.getElementById("editTaskName").value = btn.getAttribute("data-name");
      document.getElementById("editDeadline").value = btn.getAttribute("data-deadline");
      document.getElementById("editTime").value = btn.getAttribute("data-time");

      // Show modal
      const editModal = new bootstrap.Modal(document.getElementById("editTaskModal"));
      editModal.show();
    });
  });

  if (typeof attachDeleteHandlers === "function") {
    attachDeleteHandlers();
  }
}

document.addEventListener("DOMContentLoaded", loadTasks);