document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addAccountForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nameOfUser = document.getElementById("nameOfUser").value.trim();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!nameOfUser || !username || !email || !password) {
      showModal("Missing Information", "Please fill out all fields before continuing.");
      return;
    }

    try {
      const response = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameOfUser, username, email, password }),
      });

      if (response.ok) {
        console.log("Account created successfully!");
        form.reset();

        // Show the success modal
        const successModal = new bootstrap.Modal(document.getElementById("successModal"));
        successModal.show();

        // Redirect when user clicks button or after 3 seconds
        document.getElementById("goToLogin").addEventListener("click", () => {
          window.location.href = "/login";
        });

        setTimeout(() => {
          window.location.href = "/login";
        }, 3000);
      } else {
        const errorData = await response.json();
        showModal("Error", errorData.message || "Unable to create account.");
      }
    } catch (err) {
      console.error("Error submitting account:", err);
      showModal("Error", "An unexpected error occurred while creating your account.");
    }
  });

  // Helper function to show a temporary modal with a custom message
  function showModal(title, message) {
    const modalHtml = `
      <div class="modal fade" id="alertModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content text-center p-3">
            <div class="modal-header border-0">
              <h5 class="modal-title w-100">${title}</h5>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer border-0">
              <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
            </div>
          </div>
        </div>
      </div>`;

    // Remove existing alert modal if present
    const existingModal = document.getElementById("alertModal");
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const alertModal = new bootstrap.Modal(document.getElementById("alertModal"));
    alertModal.show();
  }
});