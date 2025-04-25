// myGarden.js

document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
    const checkForm = document.getElementById("checkForm");
  
    const moistureDisplay = document.getElementById("moistureData");
    const humidityDisplay = document.getElementById("humidityData");
    const tempDisplay = document.getElementById("tempData");
  
    let resetAfterClose = false;
  
    // Modal creation
    const modal = document.createElement("div");
    modal.id = "confirmation-modal";
    modal.style = `
      position: fixed;
      top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: white;
      padding: 32px;
      border: 2px solid #ccc;
      border-radius: 16px;
      z-index: 1000;
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
      width: 400px; max-width: 90vw; min-height: 220px;
      text-align: center;
      display: none;
    `;
  
    const titleEl = document.createElement("h2");
    titleEl.id = "modal-title";
    titleEl.style = "margin-bottom: 12px; font-size: 22px; color: #263a29;";
  
    const messageEl = document.createElement("p");
    messageEl.id = "modal-message";
    messageEl.style = "margin-bottom: 24px; color: #333; font-size: 16px;";
  
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Ok";
    closeBtn.style = `
      padding: 10px 20px;
      border: none;
      background-color: #263a29;
      color: white;
      border-radius: 8px;
      cursor: pointer;
      font-weight: bold;
      font-size: 16px;
    `;
    closeBtn.onclick = () => {
      modal.style.display = "none";
      if (resetAfterClose) {
        registerForm.reset();
        resetAfterClose = false;
      }
    };
  
    modal.append(titleEl, messageEl, closeBtn);
    document.body.appendChild(modal);
  
    function showModal(title, message, isError = false) {
      titleEl.textContent = title;
      titleEl.style.color = isError ? "#D8000C" : "#263a29";
      messageEl.textContent = message;
      modal.style.display = "block";
    }
  
    // === Register Plant Form ===
    registerForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const plantId = document.getElementById("plantId").value.trim();
      const plantType = document.getElementById("plantType").value.trim().toLowerCase();
      const plantName = document.getElementById("plantName").value.trim();
      const plantBirthday = document.getElementById("plantBirthday").value;
  
      try {
        const checkRes = await fetch("/check-plant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: plantId })
        });
  
        const checkData = await checkRes.json();
  
        if (checkRes.ok && checkData.exists) {
          showModal("Error", `A plant with ID '${plantId}' already exists.`, true);
          return;
        }
  
        const payload = { device_id: plantId, plantType, plantName, birthday: plantBirthday };
        const updateRes = await fetch("/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
  
        const updateData = await updateRes.json();
  
        if (updateRes.ok) {
          showModal("Plant Registration Successful!", `Plant '${plantName}' is now registered! Remember to pair your sensor box to WiFi to start scoring points.`);
          resetAfterClose = true;
        } else {
          showModal("Error", updateData.message || "Unknown error", true);
        }
      } catch (error) {
        showModal("Error", error.message, true);
      }
    });
  
    // === Check Plant Form ===
    checkForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      const checkId = document.getElementById("checkId").value.trim();
  
      // Clear previous values
      moistureDisplay.textContent = "N/A";
      humidityDisplay.textContent = "N/A";
      tempDisplay.textContent = "N/A";
  
      try {
        const res = await fetch("/fetch-plant-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: checkId })
        });
  
        if (!res.ok) {
          throw new Error("Plant ID not found.");
        }
  
        const data = await res.json();
  
        tempDisplay.textContent = typeof data.temperature === "number" ? `${data.temperature} °C` : "N/A";
        humidityDisplay.textContent = typeof data.humidity === "number" ? `${data.humidity}% / 100%` : "N/A";
        moistureDisplay.textContent = typeof data.moisture === "number"
          ? `${Math.round((data.moisture / 1015) * 100)}% / 100%`
          : "N/A";
      } catch (err) {
        showModal("Error", err.message, true);
      }
    });
  });
  