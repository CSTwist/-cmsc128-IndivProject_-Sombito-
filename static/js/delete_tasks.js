let lastDeletedTask = null;
let pendingDeleteTaskId = null;

// Delete task function
async function deleteTasks(taskId) {
    try {
        const response = await fetch("/tasks");
        const tasks = await response.json();
        lastDeletedTask = tasks.find(task => task.id == taskId);

        const deleteResponse = await fetch(`/delete_task/${taskId}`, { method: "DELETE" });
        const deleteResult = await deleteResponse.json();

        if (deleteResult.success) {
            if (typeof loadTasks === "function") {
                loadTasks();
            }

            // Hide the warning toast if still visible
            const warningToastEl = document.getElementById("deleteToastWarningTask");
            const warningToast = bootstrap.Toast.getInstance(warningToastEl);
            if (warningToast) warningToast.hide();

            // Show the deleted + undo toast
            showDeleteToastTask();
        } else {
            alert(deleteResult.message);
        }
    } catch (err) {
        console.error("Error deleting task:", err);
    }
}

// Show "Task deleted" toast
function showDeleteToastTask() {
    const toastEl = document.getElementById("deleteToastTask");
    if (!toastEl) return;
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
}

// Show warning toast
function showWarningToastTask() {
    const toastEl = document.getElementById("deleteToastWarningTask");
    if (!toastEl) return;
    const toast = new bootstrap.Toast(toastEl, { autohide: false });
    toast.show();
}

// Undo + Confirm button handlers
document.addEventListener("DOMContentLoaded", () => {
    const undoButton = document.getElementById("undoDeleteTask");
    const confirmDeleteButton = document.getElementById("confirmDeleteTask");

    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener("click", () => {
            if (pendingDeleteTaskId) {
                deleteTasks(pendingDeleteTaskId);
                pendingDeleteTaskId = null;
            }
        });
    }

    if (undoButton) {
        undoButton.addEventListener("click", async () => {
            if (!lastDeletedTask) return;

            try {
                const response = await fetch("/add_task", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        currentList,
                        taskName: lastDeletedTask.name,
                        deadline: lastDeletedTask.deadline,
                        time: lastDeletedTask.time,
                        created_at: lastDeletedTask.created_at,
                        priority: lastDeletedTask.priority
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || "Server returned an error");
                }

                if (typeof loadTasks === "function") {
                    loadTasks();
                }

                const toastEl = document.getElementById("deleteToastTask");
                const toast = bootstrap.Toast.getInstance(toastEl);
                if (toast) toast.hide();

                lastDeletedTask = null;
            } catch (err) {
                console.error("Undo failed:", err);
                alert("Undo failed. Please try again later.");
            }
        });
    }
});

// Attach delete button handlers
function attachTaskDeleteHandlers() {
    document.querySelectorAll(".delete-task").forEach(button => {
        button.addEventListener("click", e => {
            const taskId = e.currentTarget.getAttribute("data-id");
            pendingDeleteTaskId = taskId;
            showWarningToastTask();
        });
    });
}