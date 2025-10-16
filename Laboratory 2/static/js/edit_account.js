document.addEventListener("DOMContentLoaded", () => {
  const editForm = document.getElementById("editAccountForm");

  if (!editForm) return; // prevent null errors if not on admin page

  editForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const accountId = document.getElementById("editAccountId").value;
    const updatedAccount = {
      nameOfUser: document.getElementById("editNameOfUser").value.trim(),
      username: document.getElementById("editUsername").value.trim(),
      email: document.getElementById("editEmail").value.trim(),
      password: document.getElementById("editPassword").value.trim(),
    };

    try {
      const response = await fetch(`/edit_account/${accountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedAccount),
      });

      const data = await response.json();

      if (data.success) {
        const modalElement = document.getElementById("editAccountModal");
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.hide();
        loadAccounts?.(); // optional

        showModal("Success", "Account updated successfully!");
      } else {
        showModal("Error", data.message || "Failed to update account.");
      }
    } catch (error) {
      console.error("Error updating account:", error);
      showModal("Error", "An unexpected error occurred.");
    }
  });
});

// shared modal helper
function showModal(title, message) {
  const alertModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('alertModal'));
  document.getElementById("alertModalTitle").textContent = title;
  document.getElementById("alertModalBody").textContent = message;
  alertModal.show();
}