document.addEventListener("DOMContentLoaded", () => {
    loadLists(window.currentList || null);
});

// Function to load the current user's lists
async function loadLists(selectedListId = null) {
    try {
        const response = await fetch("/lists");
        if (!response.ok) throw new Error("Failed to fetch lists");

        const lists = await response.json();
        const dropdownMenu = document.querySelector(".switcher-dropdown");
        if (!dropdownMenu) return;

        // Clear previous list items (keep header)
        const header = dropdownMenu.querySelector(".switcher-header");
        dropdownMenu.innerHTML = "";
        if (header) dropdownMenu.appendChild(header);

        if (!lists.length) {
            const li = document.createElement("li");
            li.className = "dropdown-item text-muted";
            li.textContent = "No lists available";
            dropdownMenu.appendChild(li);

            document.querySelector(".switcher-name").textContent = "List Name";
            document.getElementById("taskContainer").innerHTML = `
                <div class="alert alert-secondary text-center">
                    Please choose a list to display
                </div>
            `;
            return;
        }

        // Determine currently selected list
        let currentSelectedId = selectedListId 
            ? parseInt(selectedListId) 
            : (window.currentList ? parseInt(window.currentList) : null);

        // If current selection is gone or null, pick first list
        if (!lists.find(l => l.id === currentSelectedId)) {
            currentSelectedId = lists[0].id;
        }

        const selected = lists.find(l => l.id === currentSelectedId);
        document.querySelector(".switcher-name").textContent = selected.name;
        window.currentList = currentSelectedId;

        // Populate dropdown
        lists.forEach(list => {
            const li = document.createElement("li");
            li.className = "switcher-item";

            li.innerHTML = `
                <div class="switcher-text">
                    <div class="name-type">
                        <i class="bi bi-leaf-fill"></i>
                        <span class="switcher-name dropdown-item-text" data-id="${list.id}" data-name="${list.name}">
                            ${list.name}
                        </span>
                    </div>
                    <span class="switcher-type">${capitalizeFirstLetter(list.type)}</span>
                </div>
                <i class="bi bi-check-lg check-icon"></i>
            `;

            dropdownMenu.appendChild(li);

            const checkIcon = li.querySelector(".check-icon");

            // Highlight active list
            if (list.id === currentSelectedId) {
                checkIcon.style.visibility = "visible";
                li.classList.add("active");
            } else {
                checkIcon.style.visibility = "hidden";
            }

            // Click handler for entire li
            li.addEventListener("click", async e => {
                e.preventDefault();
                e.stopPropagation();

                const id = list.id;
                const name = list.name;

                try {
                    const res = await fetch("/set_current_list", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ list_id: id, list_name: name })
                    });

                    if (!res.ok) throw new Error("Failed to set current list");

                    window.currentList = id;
                    document.querySelector(".switcherBtn .switcher-name").textContent = name;

                    // Update check marks and active class
                    dropdownMenu.querySelectorAll(".check-icon").forEach(icon => icon.style.visibility = "hidden");
                    dropdownMenu.querySelectorAll(".switcher-item").forEach(li => li.classList.remove("active"));

                    li.classList.add("active");
                    li.querySelector(".check-icon").style.visibility = "visible";

                    // Reload tasks for new list
                    if (typeof loadTasks === "function") loadTasks();

                } catch (err) {
                    console.error("Error setting list:", err);
                }
            });
        });

        // Load tasks for current list
        loadTasks();

    } catch (err) {
        console.error("Error loading lists:", err);
        document.querySelector(".switcher-name").textContent = "List Name";
    }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}