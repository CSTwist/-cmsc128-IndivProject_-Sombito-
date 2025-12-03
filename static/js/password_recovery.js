document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("recoveryForm");
    const message = document.getElementById("recoveryMessage");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("recoveryEmail").value.trim(); // Updated ID

        if (!email) {
            message.textContent = "Please enter your email.";
            message.classList.add("text-danger");
            message.classList.remove("text-success");
            return;
        }

        try {
            const response = await fetch("/password_recovery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                message.textContent = data.message;
                message.classList.remove("text-danger");
                message.classList.add("text-success");
            } else {
                message.textContent = data.message;
                message.classList.remove("text-success");
                message.classList.add("text-danger");
            }
        } catch (err) {
            console.error(err);
            message.textContent = "An error occurred. Try again.";
            message.classList.add("text-danger");
            message.classList.remove("text-success");
        }
    });
});