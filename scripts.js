
    let currentStep = 0;
    let steps = document.querySelectorAll(".step");
    let progressBar = document.getElementById("progressBar");
    let nextBtn = document.getElementById("nextBtn");
    let prevBtn = document.getElementById("prevBtn");
    let loadingOverlay = document.getElementById("loadingOverlay");

    // Format identity number (1234-5678-90123)
    function formatIdentity(input) {
      let value = input.value.replace(/\D/g, '');
      if (value.length > 4) value = value.slice(0, 4) + '-' + value.slice(4);
      if (value.length > 9) value = value.slice(0, 9) + '-' + value.slice(9, 14);
      input.value = value.slice(0, 15);
    }

    // Format phone number (1234-5678)
    function formatPhone(input) {
      let value = input.value.replace(/\D/g, '');
      if (value.length > 4) value = value.slice(0, 4) + '-' + value.slice(4, 8);
      input.value = value.slice(0, 9);
    }

    // Apply formatting to identity and phone inputs
    document.querySelectorAll('input[name="Identidad"], input[name="Conyuge Identidad"]').forEach(input => {
      input.addEventListener('input', () => formatIdentity(input));
    });

    document.querySelectorAll('input[name="Teléfono Domicilio"], input[name="Celular"], input[name="Conyuge Teléfono"], input[name$="Tel Casa"], input[name$="Tel Trabajo"]').forEach(input => {
      input.addEventListener('input', () => formatPhone(input));
    });

    // Show loading screen on page load
    window.addEventListener('load', function() {
      setTimeout(() => {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 500);
      }, 1200);
    });

    // MAPA DOMICILIO
    let map = L.map('map').setView([16.3, -86.55], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    let markerDomicilio;
    map.on('click', function(e) {
      if (markerDomicilio) map.removeLayer(markerDomicilio);
      markerDomicilio = L.marker(e.latlng).addTo(map);
      document.getElementById("domicilioCoords").value = e.latlng.lat + "," + e.latlng.lng;
    });

    // MAPA TRABAJO
    let mapTrabajo = L.map('mapTrabajo').setView([16.3, -86.55], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapTrabajo);
    let markerTrabajo;
    mapTrabajo.on('click', function(e) {
      if (markerTrabajo) mapTrabajo.removeLayer(markerTrabajo);
      markerTrabajo = L.marker(e.latlng).addTo(mapTrabajo);
      document.getElementById("trabajoCoords").value = e.latlng.lat + "," + e.latlng.lng;
    });

    showStep(currentStep);
    function showStep(n) {
      steps.forEach(step => step.classList.remove("active"));
      steps[n].classList.add("active");

      if (steps[n].querySelector("#map")) setTimeout(() => map.invalidateSize(), 200);
      if (steps[n].querySelector("#mapTrabajo")) setTimeout(() => mapTrabajo.invalidateSize(), 200);

      prevBtn.style.display = n === 0 ? "none" : "block";

      let progress = ((n + 1) / steps.length) * 100;
      progressBar.style.width = progress + "%";

      nextBtn.innerText = n === steps.length - 1 ? "Enviar" : "Siguiente";
    }

    function nextPrev(n) {
      if (n === 1 && !validateForm()) return;
      currentStep += n;

      if (currentStep >= steps.length) {
        enviarForm();
        return;
      }
      showStep(currentStep);
    }

    function validateForm() {
      let inputs = steps[currentStep].querySelectorAll("input, select");
      let isValid = true;
      let estadoCivil = document.getElementById("estadoCivil").value;

      for (let input of inputs) {
        // Skip validation for Cónyuge fields if Estado Civil is Soltero
        if (estadoCivil === "Soltero" && (
          input.id === "conyugeNombre" ||
          input.id === "conyugeIdentidad" ||
          input.id === "conyugeTrabajo" ||
          input.id === "conyugeCargo" ||
          input.id === "conyugeTelefono"
        )) {
          continue;
        }

        if (input.hasAttribute("required") && input.value === "") {
          input.style.borderColor = "#e63946";
          input.style.animation = "shake 0.3s";
          setTimeout(() => input.style.animation = "", 300);
          isValid = false;
        } else if (input.name === "Identidad" || input.name === "Conyuge Identidad") {
          if (input.value && !/^\d{4}-\d{4}-\d{5}$/.test(input.value)) {
            input.style.borderColor = "#e63946";
            input.style.animation = "shake 0.3s";
            setTimeout(() => input.style.animation = "", 300);
            isValid = false;
          } else {
            input.style.borderColor = "#dfe6e9";
          }
        } else if (input.type === "tel" && input.hasAttribute("required") && input.value) {
          if (!/^\d{4}-\d{4}$/.test(input.value)) {
            input.style.borderColor = "#e63946";
            input.style.animation = "shake 0.3s";
            setTimeout(() => input.style.animation = "", 300);
            isValid = false;
          } else {
            input.style.borderColor = "#dfe6e9";
          }
        } else if (input.name === "Salario" && input.value < 0) {
          input.style.borderColor = "#e63946";
          input.style.animation = "shake 0.3s";
          setTimeout(() => input.style.animation = "", 300);
          isValid = false;
        } else {
          input.style.borderColor = "#dfe6e9";
        }
      }
      return isValid;
    }

    function toggleConyuge() {
      let estado = document.getElementById("estadoCivil").value;
      let conyugeStep = document.getElementById("conyugeStep");
      let conyugeInputs = conyugeStep.querySelectorAll("input");

      conyugeStep.classList.toggle("hidden", !(estado === "Casado" || estado === "Union Libre"));
      steps = document.querySelectorAll(".step");

      // Toggle required attribute for Cónyuge fields
      conyugeInputs.forEach(input => {
        if (estado === "Casado" || estado === "Union Libre") {
          input.setAttribute("required", "");
        } else {
          input.removeAttribute("required");
        }
      });
    }

    function enviarForm() {
      loadingOverlay.style.display = 'flex';
      loadingOverlay.style.opacity = '1';
      loadingOverlay.querySelector('.loading-text').textContent = 'Enviando datos...';

      let form = document.getElementById("creditoForm");
      let data = new FormData(form);
      let queryString = new URLSearchParams(data).toString();

      let scriptURL = "https://script.google.com/macros/s/AKfycbw48oFtRDunqSPqcMKxVpPGyiaGuU4EGlu93W5ikYJNo1jyzHt61Oo6cImPes0e2cn2aQ/exec";

      fetch(`${scriptURL}?${queryString}`)
        .then(response => response.text())
        .then(resp => {
          loadingOverlay.querySelector('.loading-text').textContent = 'Datos enviados correctamente. El asesor se contactara pronto con su persona';
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        })
        .catch(err => {
          loadingOverlay.querySelector('.loading-text').textContent = `Error: ${err}`;
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        });
    }
    // Escuchar cambios en la fecha de nacimiento
  document.getElementById("fechaNacimiento").addEventListener("change", function() {
    const fechaNac = new Date(this.value);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();

    // Ajuste si aún no cumplió años este año
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }

    document.getElementById("edad").value = edad >= 0 ? edad : "";
  });