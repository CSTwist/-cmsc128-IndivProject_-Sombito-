document.addEventListener("DOMContentLoaded", () => {
    const createListButton = document.querySelector("#addList .btn-primary[data-bs-dismiss='modal']");
    const listTitleInput = document.getElementById("todoListTitle");

    if (!createListButton || !listTitleInput) return;

    createListButton.addEventListener("click", async () => {
        const name = listTitleInput.value.trim();

        // Get selected type radio button
        const typeRadio = document.querySelector("#addList input[name='type']:checked");
        const type = typeRadio ? typeRadio.value.toLowerCase() : "personal";

        if (!name) {
            showAddListToast("Please enter a list title.", false);
            return;
        }

        try {
            const response = await fetch("/add_list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, type })
            });

            const data = await response.json();

            if (data.success) {
                showAddListToast("List added successfully!", true);

                // Reload lists
                if (typeof loadLists === "function") {
                    await loadLists(data.id); // Pass new list id as selectedListId
                }

                // Clear input and radio buttons
                listTitleInput.value = "";
                if (typeRadio) typeRadio.checked = false;

                // Close modal (Bootstrap)
                const addListModal = bootstrap.Modal.getInstance(document.getElementById("addList"));
                if (addListModal) addListModal.hide();
                window.location.reload()
            } else {
                showAddListToast(data.message || "Failed to add list.", false);
            }
        } catch (err) {
            console.error("Error adding list:", err);
            showAddListToast("An error occurred while adding the list.", false);
        }
    });
});

// -------------------- TOAST FEEDBACK --------------------
function showAddListToast(message, success = true) {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container position-fixed top-0 end-0 p-3";
        document.body.appendChild(container);
    }

    const toastEl = document.createElement("div");
    toastEl.className = `toast align-items-center text-bg-${success ? "success" : "danger"} border-0`;
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");

    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    container.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();

    toastEl.addEventListener("hidden.bs.toast", () => {
        toastEl.remove();
    });
}