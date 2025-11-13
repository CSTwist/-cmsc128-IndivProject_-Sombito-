document.addEventListener("DOMContentLoaded", () => {
    const deleteBtn = document.querySelector(".delete-list");

    if (!deleteBtn) return;

    deleteBtn.addEventListener("click", () => {
        const listId = currentList; // use global currentList from session
        if (!listId) {
            console.error("No list selected to delete.");
            return;
        }

        // Show confirmation toast
        const deleteToastEl = document.getElementById("deleteToastWarningList");
        const deleteToast = new bootstrap.Toast(deleteToastEl);
        deleteToast.show();

        const confirmBtn = document.getElementById("confirmDeleteList");
        const cancelBtn = deleteToastEl.querySelector("[data-bs-dismiss='toast']");

        // Remove previous click listeners
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        const newConfirmBtn = document.getElementById("confirmDeleteList");

        newConfirmBtn.addEventListener("click", async () => {
            try {
                const response = await fetch(`/delete_list/${listId}`, { method: "DELETE" });
                const data = await response.json();

                if (data.success) {
                    deleteToast.hide();

                    // Update current list
                    if (data.new_list) {
                        currentList = data.new_list.id;
                        document.querySelector(".switcherBtn .switcher-name").textContent = data.new_list.name;
                    } else {
                        currentList = null;
                        document.querySelector(".switcherBtn .switcher-name").textContent = "List Name";
                        document.getElementById("taskContainer").innerHTML = `
                            <div class="alert alert-secondary text-center">
                                Please choose a list to display
                            </div>
                        `;
                    }

                    // Reload lists and tasks
                    if (typeof loadLists === "function") await loadLists(currentList);
                    if (typeof loadTasks === "function") await loadTasks();
                } else {
                    console.error("Failed to delete list:", data.message);
                }
            } catch (err) {
                console.error("Error deleting list:", err);
            }
        });

        // Optional: cancel button auto closes toast
        cancelBtn.addEventListener("click", () => deleteToast.hide());
    });
});