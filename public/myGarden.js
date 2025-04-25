document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
  
    let resetAfterClose = false;
  
    // Modal creation
    const modal = document.createElement("div");
    modal.id = "confirmation-modal";
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.backgroundColor = "white";
    modal.style.padding = "32px";
    modal.style.border = "2px solid #ccc";
    modal.style.borderRadius = "16px";
    modal.style.zIndex = "1000";
    modal.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.25)";
    modal.style.width = "400px";
    modal.style.minHeight = "220px";
    modal.style.textAlign = "center";
    modal.style.display = "none";
    modal.style.maxWidth = "90vw";
  
    // Modal title
    const titleEl = document.createElement("h2");
    titleEl.id = "modal-title";
    titleEl.style.marginBottom = "12px";
    titleEl.style.fontSize = "22px";
    titleEl.style.color = "#263a29";
  
    // Modal message
    const messageEl = document.createElement("p");
    messageEl.id = "modal-message";
    messageEl.style.marginBottom = "24px";
    messageEl.style.color = "#333";
    messageEl.style.fontSize = "16px";
  
    const closeBtn = document.createElement("button");
    closeBtn.id = "modal-close";
    closeBtn.textContent = "Ok";
    closeBtn.style.padding = "10px 20px";
    closeBtn.style.border = "none";
    closeBtn.style.backgroundColor = "#263a29";
    closeBtn.style.color = "white";
    closeBtn.style.borderRadius = "8px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontWeight = "bold";
    closeBtn.style.fontSize = "16px";
  
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
      if (resetAfterClose) {
        registerForm.reset();
        resetAfterClose = false;
      }
    });
  
    modal.appendChild(titleEl);
    modal.appendChild(messageEl);
    modal.appendChild(closeBtn);
    document.body.appendChild(modal);
  
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
          body: JSON.stringify({ device_id: plantId, plantType })
        });
  
        const checkData = await checkRes.json();
  
        if (checkRes.ok && checkData.exists) {
          titleEl.textContent = "Error";
          titleEl.style.color = "#D8000C"; // red
          messageEl.textContent = `A plant with ID '${plantId}' and type '${plantType}' already exists.`;
          modal.style.display = "block";
          return;
        }
  
        const payload = {
          device_id: plantId,
          plantType,
          plantName,
          birthday: plantBirthday
        };
  
        const updateRes = await fetch("/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
  
        const updateData = await updateRes.json();
  
        if (updateRes.ok) {
          titleEl.textContent = "Plant Registration Successful!";
          titleEl.style.color = "#263a29";
          messageEl.textContent = `Plant '${plantName}' is now registered! Remember to pair your sensor box to WiFi to start scoring points.`;
          resetAfterClose = true;
          modal.style.display = "block";
        } else {
          titleEl.textContent = "Error";
          titleEl.style.color = "#D8000C";
          messageEl.textContent = `Error registering plant: ${updateData.message || "Unknown error"}`;
          modal.style.display = "block";
        }
      } catch (error) {
        titleEl.textContent = "Error";
        titleEl.style.color = "#D8000C";
        messageEl.textContent = `Unexpected error: ${error.message}`;
        modal.style.display = "block";
        console.error("Unexpected error during registration:", error);
      }
    });
  });
  