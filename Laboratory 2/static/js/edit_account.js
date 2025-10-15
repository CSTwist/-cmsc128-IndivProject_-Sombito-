document.getElementById("editAccountForm").addEventListener("submit", async function (event) {
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
      loadAccounts();
    } else {
      alert("Failed to update account: " + data.message);
    }
  } catch (error) {
    console.error("Error updating account:", error);
    alert("An error occurred while updating the account.");
  }
});