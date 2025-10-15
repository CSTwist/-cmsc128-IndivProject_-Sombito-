let lastDeletedTask = null;

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

// Undo button handler
document.addEventListener("DOMContentLoaded", () => {
    const undoButton = document.getElementById("undoDelete");

    if (undoButton) {
        undoButton.addEventListener("click", async () => {
            if (!lastDeletedTask) return;

            await fetch("/add_task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    taskName: lastDeletedTask.name,
                    deadline: lastDeletedTask.deadline,
                    time: lastDeletedTask.time,
                    created_at: lastDeletedTask.created_at,
                    priority: lastDeletedTask.priority
                })
            });

            if (typeof loadTasks === "function") {
                loadTasks();
            }

            const toastElementId = document.getElementById("deleteToast");
            const toast = bootstrap.Toast.getInstance(toastElementId);
            if (toast) toast.hide();

            lastDeletedTask = null;
        });
    }
});

// Attach delete handlers
function attachDeleteHandlers(params) {

    document.querySelectorAll(".delete-task").forEach(button => {
        button.addEventListener("click", e =>{
            const taskId = e.currentTarget.getAttribute("data-id");
            if (!confirm("Are you sure you want to delete this task?")) return;
            deleteTasks(taskId);
        });
    });

}