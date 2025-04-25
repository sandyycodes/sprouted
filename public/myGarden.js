document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("registerForm");
  
    // Modal creation
    const modal = document.createElement("div");
    modal.id = "confirmation-modal";
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.backgroundColor = "white";
    modal.style.padding = "24px";
    modal.style.border = "2px solid #ccc";
    modal.style.borderRadius = "12px";
    modal.style.zIndex = "1000";
    modal.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    modal.style.width = "300px";
    modal.style.textAlign = "center";
    modal.style.display = "none";
  
    // Modal content
    const messageEl = document.createElement("p");
    messageEl.id = "modal-message";
    messageEl.style.marginBottom = "16px";
    messageEl.style.color = "#333";
    messageEl.style.fontSize = "16px";
  
    const closeBtn = document.createElement("button");
    closeBtn.id = "modal-close";
    closeBtn.textContent = "OK";
    closeBtn.style.padding = "8px 16px";
    closeBtn.style.border = "none";
    closeBtn.style.backgroundColor = "#263a29";
    closeBtn.style.color = "white";
    closeBtn.style.borderRadius = "8px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontWeight = "bold";
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  
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
        // Step 1: Check if the plant already exists
        const checkRes = await fetch("/check-plant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ device_id: plantId, plantType })
        });
          
  
        const checkData = await checkRes.json();
  
        if (checkRes.ok && checkData.exists) {
          messageEl.textContent = `A plant with ID '${plantId}' and type '${plantType}' already exists.`;
          modal.style.display = "block";
          return;
        }
  
        // Step 2: Submit registration
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
          messageEl.textContent = `Plant '${plantName}' registered successfully.`;
          modal.style.display = "block";
          registerForm.reset();
        } else {
          messageEl.textContent = `Error registering plant: ${updateData.message || "Unknown error"}`;
          modal.style.display = "block";
        }
      } catch (error) {
        messageEl.textContent = `Unexpected error: ${error.message}`;
        modal.style.display = "block";
        console.error("Unexpected error during registration:", error);
      }
    });
  });
  