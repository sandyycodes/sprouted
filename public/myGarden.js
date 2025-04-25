document.getElementById("registerForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const plantId = document.getElementById("plantId").value;
    const plantType = document.getElementById("plantType").value;
    const plantName = document.getElementById("plantName").value;
    const plantBirthday = document.getElementById("plantBirthday").value;

    const payload = {
        device_id: plantId,
        plantType,
        plantName,
        birthday: plantBirthday
    };

    fetch("http://localhost:3000/update", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Server returned error");
        }
        return response.json();
    })
    .then(data => {
        showModal(`✅ ${plantName} registered successfully! Score: ${Math.round(data.score)} 🌱`);
        document.getElementById("registerForm").reset();
    })
    .catch(error => {
        console.error("Error registering plant:", error);
        showModal("❌ Error registering plant. Please check that the Plant ID exists and try again.");
    });
});

// Modal logic
function showModal(message) {
    const modal = document.getElementById("confirmationModal");
    const modalMsg = document.getElementById("modal-message");
    const closeBtn = document.getElementById("modal-close");

    modalMsg.textContent = message;
    modal.classList.remove("hidden");

    closeBtn.onclick = function () {
        modal.classList.add("hidden");
    };
}
