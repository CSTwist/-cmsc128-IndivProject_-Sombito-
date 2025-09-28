let tasks = [];             // keep tasks in memory
let currentSort = null;     // remember last selected sort option
let sortDirection = "asc";  // default ascending

async function loadTasks(sortBy = null) {
  // If no new sort option provided, reuse the last one
  if (sortBy) {
    currentSort = sortBy;
  } else if (currentSort) {
    sortBy = currentSort;
  }

  const response = await fetch("/tasks");
  if (!response.ok) {
    console.error("Failed to fetch tasks");
    return;
  }

  tasks = await response.json();

  // Apply sorting if currentSort is set
  if (sortBy) {
    tasks.sort((a, b) => {
      let result = 0;

      if (sortBy === "name") {
        result = a.name.localeCompare(b.name);
      } else if (sortBy === "deadline") {
        result =
          new Date(a.deadline + " " + a.time) -
          new Date(b.deadline + " " + b.time);
      } else if (sortBy === "priority") {
        const order = { High: 1, Medium: 2, Low: 3 };
        result = order[a.priority] - order[b.priority];
      }

      // Apply direction (asc/desc)
      return sortDirection === "asc" ? result : -result;
    });
  }

  const container = document.getElementById("taskContainer");
  container.innerHTML = "";

  tasks.forEach((task) => {
    const card = document.createElement("div");
    card.className = "card mb-3";

    card.innerHTML = `
      <div class="card-body">
        <div class="row align-items-center">
          <div class="col-1 text-center">
            <input class="checkbox form-check-input" type="checkbox">
          </div>
            ${task.name} 
            <span class="badge bg-${
              task.priority === "High"
                ? "danger"
                : task.priority === "Medium"
                ? "warning text-dark"
                : "success"
            } ms-2">${task.priority}</span>
          </div>
          <div class="deadline col-3">${task.deadline} ${task.time}</div>
          <div class="actions col-2 text-center">
            <button class="edit-task btn btn-sm btn-outline-primary" 
                    data-id="${task.id}" 
                    data-name="${task.name}" 
                    data-deadline="${task.deadline}" 
                    data-time="${task.time}"
                    data-priority="${task.priority}"
                    title="Edit Task">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="delete-task btn btn-sm btn-outline-danger" 
                    data-id="${task.id}" 
                    title="Delete Task">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);

    // Edit button handler
    card.querySelector(".edit-task").addEventListener("click", (e) => {
      const btn = e.target.closest("button");

      document.getElementById("editTaskId").value = btn.getAttribute("data-id");
      document.getElementById("editTaskName").value = btn.getAttribute("data-name");
      document.getElementById("editDeadline").value = btn.getAttribute("data-deadline");
      document.getElementById("editTime").value = btn.getAttribute("data-time");

      const priority = btn.getAttribute("data-priority");
      const priorityRadio = document.querySelector(
        `#editTaskForm input[name="priority"][value="${priority}"]`
      );
      if (priorityRadio) {
        priorityRadio.checked = true;
      }

      const editModal = new bootstrap.Modal(document.getElementById("editTaskModal"));
      editModal.show();
    });
  });

  if (typeof attachDeleteHandlers === "function") {
    attachDeleteHandlers();
  }
}

// Checkbox highlight
document.addEventListener("change", (e) => {
  if (e.target.classList.contains("checkbox")) {
    const cardBody = e.target.closest(".card-body");
    if (e.target.checked) {
      cardBody.classList.add("checked");
    } else {
      cardBody.classList.remove("checked");
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  loadTasks(); // initial load

  // Dropdown sorting
  document.querySelectorAll(".sort-option").forEach((option) => {
    option.addEventListener("click", (e) => {
      const sortBy = e.target.getAttribute("data-sort");

      // remove active class from all
      document.querySelectorAll(".sort-option").forEach((opt) => {
        opt.classList.remove("active");
      });

      // add active class to clicked one
      e.target.classList.add("active");

      loadTasks(sortBy);
    });
  });

  // Asc/Desc button
  toggleButton.innerHTML = "⬆️ Asc"; // default label

  toggleButton.addEventListener("click", () => {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
    toggleButton.innerHTML = sortDirection === "asc" ? "Ascending" : "Descending";

    loadTasks(); // reload with new direction
  });
});