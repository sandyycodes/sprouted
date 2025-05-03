// myGarden.js

document.addEventListener("DOMContentLoaded", function () {
  const registerForm = document.getElementById("registerForm");
  const checkForm = document.getElementById("checkForm");

  const moistureDisplay = document.getElementById("moistureData");
  const humidityDisplay = document.getElementById("humidityData");
  const tempDisplay = document.getElementById("tempData");
  const plantTitle = document.getElementById("plantDataTitle");

  let resetAfterClose = false;

  function showModal(title, message, isError = false) {
    const modal = document.getElementById("confirmationModal");
    const messageEl = document.getElementById("modal-message");
    const closeBtn = document.getElementById("modal-close");

    messageEl.textContent = message;
    messageEl.style.color = isError ? "#D8000C" : "#263a29";
    modal.classList.remove("hidden");

    closeBtn.onclick = () => {
      modal.classList.add("hidden");
      if (resetAfterClose) {
        registerForm.reset();
        resetAfterClose = false;
      }
    };
  }



  // Register form
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
    
      const nameCheckRes = await fetch("/check-plant-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantName })
      });
    
      const nameCheckData = await nameCheckRes.json();
    
      if (nameCheckRes.ok && nameCheckData.exists) {
        showModal("Error", `The plant name '${plantName}' is already taken. Please choose a different name.`, true);
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

  // Check form
  checkForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const checkName = document.getElementById("checkName").value.trim();

    // Clear previous data
    moistureDisplay.textContent = "N/A";
    humidityDisplay.textContent = "N/A";
    tempDisplay.textContent = "N/A";
    plantTitle.textContent = "Plant Data";

    try {
      const res = await fetch("/fetch-plant-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantName: checkName })
      });

      if (!res.ok) {
        throw new Error("Plant name not found.");
      }

      const data = await res.json();

      if (data.plantName && data.plantName.trim() !== "") {
        plantTitle.textContent = `${data.plantName}'s Data`;
      } else {
        plantTitle.textContent = "Plant Data";
      }

      tempDisplay.textContent = typeof data.temperature === "number" ? `${data.temperature} °C` : "N/A";
      humidityDisplay.textContent = typeof data.humidity === "number" ? `${data.humidity}%` : "N/A";
      moistureDisplay.textContent = typeof data.moisture === "number"
        ? `${Math.round((data.moisture / 1015) * 100)}%`
        : "N/A";
    } catch (error) {
      showModal("Error", error.message, true);
    }
  });

  const tooltipContainers = document.querySelectorAll('.info-icon-container');

  tooltipContainers.forEach(container => {
    const tooltip = container.querySelector('.tooltip-text');

    container.addEventListener('mouseenter', adjustTooltip);
    container.addEventListener('click', adjustTooltip); // for mobile tap

    function adjustTooltip() {
      const rect = tooltip.getBoundingClientRect();
      const margin = 8; // 8px gap from the edge
      tooltip.style.left = '50%'; // reset
      tooltip.style.transform = 'translateX(-50%)'; // reset

      if (rect.left < margin) {
        tooltip.style.left = `${margin}px`;
        tooltip.style.transform = 'none';
      }
    }
  });

});
