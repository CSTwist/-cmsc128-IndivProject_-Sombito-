let lastDeletedAccount = null;

async function deleteAccount(accountId) {
  const response = await fetch("/accounts");
  const accounts = await response.json();
  lastDeletedAccount = accounts.find(acc => acc.id == accountId);

  const deleteResponse = await fetch(`/delete_account/${accountId}`, { method: "DELETE" });
  const deleteResult = await deleteResponse.json();

  if (deleteResult.success) {
    if (typeof loadAccounts === "function") {
      loadAccounts();
    }
    showDeleteToast();
  } else {
    alert(deleteResult.message);
  }
}

function showDeleteToast() {
  const toastElementId = document.getElementById("deleteToast");
  if (!toastElementId) return;
  const toast = new bootstrap.Toast(toastElementId, { delay: 30000 });
  toast.show();
}

document.addEventListener("DOMContentLoaded", () => {
  const undoButton = document.getElementById("undoDelete");

  if (undoButton) {
    undoButton.addEventListener("click", async () => {
      if (!lastDeletedAccount) return;

      await fetch("/add_account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lastDeletedAccount)
      });

      if (typeof loadAccounts === "function") {
        loadAccounts();
      }

      const toastElementId = document.getElementById("deleteToast");
      const toast = bootstrap.Toast.getInstance(toastElementId);
      if (toast) toast.hide();

      lastDeletedAccount = null;
    });
  }
});

function attachDeleteHandlers() {
  document.querySelectorAll(".delete-account").forEach(button => {
    button.addEventListener("click", e => {
      const accountId = e.currentTarget.getAttribute("data-id");
      if (!confirm("Are you sure you want to delete this account?")) return;
      deleteAccount(accountId);
    });
  });
}