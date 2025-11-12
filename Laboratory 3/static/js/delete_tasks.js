let lastDeletedTask = null;
let pendingDeleteTaskId = null;

// Delete task function
async function deleteTasks(taskId) {
    const response = await fetch("/tasks");

    const tasks = await response.json();
    lastDeletedTask = tasks.find(task => task.id == taskId);
    
    const deleteResponse = await fetch(`/delete_task/${taskId}`, { method: "DELETE"});
    const deleteResult = await deleteResponse.json();

    if (deleteResult.success) {
        if (typeof loadTasks === "function") {
            loadTasks();
        }

        showDeleteToast();

    } else {
        alert(deleteResult.message);        
    }
}

    // Show toast function
function showDeleteToast() {
    const toastElementId = document.getElementById("deleteToast");
    if (!toastElementId) return;
    const toast = new bootstrap.Toast(toastElementId, { delay: 30000 });
    toast.show();
}

function showWarningToast() {
    const toastElementId = document.getElementById("deleteToastWarning");
    if (!toastElementId) return;
    const toast = new bootstrap.Toast(toastElementId, { autohide: true, delay: 5000 });
    toast.show();

    toastElementId.addEventListener("hidden.bs.toast", () => {
        if (pendingDeleteTaskId) {
            pendingDeleteTaskId = null;
        }
    }, { once: true });
}

// Undo button handler
document.addEventListener("DOMContentLoaded", () => {
    const undoButton = document.getElementById("undoDelete");
    const confirmDeleteButton = document.getElementById("confirmDelete");

     if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener("click", () => {
            if (pendingDeleteTaskId) {
                deleteTasks(pendingDeleteTaskId);
                pendingDeleteTaskId = null;

                const toastEl = document.getElementById("deleteToastWarning");
                const toast = bootstrap.Toast.getInstance(toastEl);
                if (toast) toast.hide();
            }
        });
    }

    if (undoButton) {
        undoButton.addEventListener("click", async () => {

            if (pendingDeleteTaskId) {
                pendingDeleteTaskId = null;
                return;
            }

            if (!lastDeletedTask) return;

            try {
                const response = await fetch("/add_task", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        currentUser,
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

                const toastElementId = document.getElementById("deleteToast");
                const toast = bootstrap.Toast.getInstance(toastElementId);
                if (toast) toast.hide();

                lastDeletedTask = null;
            } catch {
                console.error("Undo failed", err);
                alert("Undo failed. Please try again later.");
            }
        });
    }
},)

// Attach delete handlers
function attachDeleteHandlers(params) {

    document.querySelectorAll(".delete-task").forEach(button => {
        button.addEventListener("click", e =>{
            const taskId = e.currentTarget.getAttribute("data-id");
            pendingDeleteTaskId = taskId;
            showWarningToast();
        });
    });
}