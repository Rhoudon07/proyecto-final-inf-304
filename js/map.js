document.addEventListener('DOMContentLoaded', function () {
  const mapElement = document.getElementById('map');
  // 1. Inicializar el mapa en las coordenadas de Santiago
  const map = L.map('map').setView([19.45, -70.7], 13);

  // 2. Añadir la capa de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // 4. Capas para rutas y alertas
  const routeLayer = L.layerGroup().addTo(map);
  const alertLayer = L.layerGroup().addTo(map);
  const interconexionLayer = L.layerGroup().addTo(map);

  // 6. Elementos del DOM para el modal de reporte
  const reportModal = document.getElementById('report-modal');
  const closeModalButton = document.querySelector('.close-button');
  const reportAlertButton = document.getElementById('report-alert-btn');
  const reportForm = document.getElementById('report-form');
  const reportLatInput = document.getElementById('report-lat');
  const reportLngInput = document.getElementById('report-lng');

  // 7. Elementos del DOM para el panel de alertas
  const alertPanel = document.getElementById('alert-panel');
  const alertList = document.getElementById('alert-list');
  const alertSpinner = document.getElementById('alert-spinner');
  const alertFilters = document.querySelectorAll('.alert-filter-cb');
  const locateButton = document.getElementById('locate-btn');

  // Variable para almacenar todas las alertas obtenidas del servidor
  let allAlerts = [];

  // Variable para el intervalo de actualización de alertas
  let alertRefreshInterval = null;


  // 3. Función para añadir los datos GeoJSON al mapa
  async function addMonorrielRoute() {
    try {
      // Cargamos los datos desde nuestra API usando una URL relativa
      // El backend debe estar corriendo para que esto funcione
      const response = await fetch('/api/rutas/monorriel/linea1');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();

      // Limpiamos la capa de rutas antes de añadir una nueva
      routeLayer.clearLayers();
      // Ocultamos el panel de alertas y la capa de alertas
      alertPanel.style.display = 'none';
      alertLayer.clearLayers();
      // Detenemos la actualización automática de alertas
      if (alertRefreshInterval) {
        clearInterval(alertRefreshInterval);
      }

      // Añadimos la capa GeoJSON al mapa
      L.geoJSON(data, {
        style: function (feature) {
          // Estilo para la línea de la ruta
          if (feature.geometry.type === 'LineString') {
            return {
              color: feature.properties.color || '#ff0000',
              weight: 5,
              opacity: 0.8
            };
          }
        },
        onEachFeature: function (feature, layer) {
          // Añadir popups a cada elemento (estaciones y ruta)
          if (feature.properties && feature.properties.name) {
            let popupContent = `<b>${feature.properties.name}</b>`;
            if (feature.properties.horario) {
              popupContent += `<br>Horario: ${feature.properties.horario}`;
            }
            if (feature.properties.interconexion) {
              popupContent += `<br>Interconexión: ${feature.properties.interconexion.join(', ')}`;
            }
            layer.bindPopup(popupContent);
          }
        }
      }).addTo(routeLayer);
    } catch (error) {
      console.error('Error al cargar la ruta del monorriel:', error);
    }
  }

  // 5. Función para cargar y mostrar alertas de tráfico
  async function loadTrafficAlerts() {
    alertSpinner.style.display = 'block'; // Mostrar spinner
    alertList.innerHTML = ''; // Limpiar lista para que solo se vea el spinner
    try {
      const response = await fetch('/api/alertas');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const alertas = await response.json();

      allAlerts = alertas; // Guardamos todas las alertas en la variable global

      // Ocultar spinner después de recibir la respuesta
      alertSpinner.style.display = 'none';

      // 8. Iconos de diferentes colores para cada tipo de alerta
      const icons = {
        accidente: L.icon({ // Rojo para accidentes
          iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        }),
        congestion: L.icon({ // Amarillo para congestión
          iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        }),
        obra: L.icon({ // Amarillo para obras
          iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        }),
        default: L.icon({ // Azul por defecto
          iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        })
      };

      applyAlertFilters(); // Renderizamos las alertas aplicando los filtros

    } catch (error) {
      console.error('Error al cargar las alertas de tráfico:', error);
      // Asegurarse de ocultar el spinner también en caso de error
      alertSpinner.style.display = 'none';
    }
  }

  // Función para renderizar las alertas (en mapa y panel) según un array filtrado
  function renderAlerts(alertsToRender) {
    alertLayer.clearLayers();
    alertList.innerHTML = '';

    const icons = {
      accidente: L.icon({ iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }),
      congestion: L.icon({ iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }),
      obra: L.icon({ iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] }),
      default: L.icon({ iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] })
    };

    const getIcon = (type) => icons[type] || icons.default;
    const capitalize = (s) => s && s.charAt(0).toUpperCase() + s.slice(1);

    if (allAlerts.length > 0) {
      alertPanel.style.display = 'block';
    } else {
      alertPanel.style.display = 'none';
    }

    alertsToRender.forEach(alerta => {
      const marker = L.marker([alerta.lat, alerta.lng], { icon: getIcon(alerta.tipo) })
        .addTo(alertLayer);

      const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return `hace ${Math.floor(interval)} años`;
        interval = seconds / 2592000;
        if (interval > 1) return `hace ${Math.floor(interval)} meses`;
        interval = seconds / 86400;
        if (interval > 1) return `hace ${Math.floor(interval)} días`;
        interval = seconds / 3600;
        if (interval > 1) return `hace ${Math.floor(interval)} horas`;
        interval = seconds / 60;
        if (interval > 1) return `hace ${Math.floor(interval)} minutos`;
        return `hace ${Math.floor(seconds)} segundos`;
      };

      const popupContent = `<b>Alerta: ${capitalize(alerta.tipo)}</b><br>${alerta.descripcion}<br><small>${timeAgo(alerta.createdAt)}</small>`;
      marker.bindPopup(popupContent);

      // Añadir alerta a la lista del panel como un botón dentro de un li
      const listItem = document.createElement('li');
      const listButton = document.createElement('button');
      listButton.innerHTML = `<strong>${capitalize(alerta.tipo)}:</strong> ${alerta.descripcion}<br><small>${timeAgo(alerta.createdAt)}</small>`;
      listButton.addEventListener('click', () => {
        map.setView([alerta.lat, alerta.lng], 16);
        marker.openPopup();
      });
      listItem.appendChild(listButton);
      alertList.appendChild(listItem);
    });
  }

  // Función que lee los filtros y llama a renderAlerts
  function applyAlertFilters() {
    const selectedTypes = Array.from(alertFilters)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    const filteredAlerts = allAlerts.filter(alerta => selectedTypes.includes(alerta.tipo));
    renderAlerts(filteredAlerts);
  }

  // --- Lógica para guardar y cargar preferencias de filtros ---

  function saveFilterPreferences() {
    const preferences = {};
    alertFilters.forEach(cb => {
      preferences[cb.value] = cb.checked;
    });
    localStorage.setItem('alertFilterPreferences', JSON.stringify(preferences));
  }

  function loadFilterPreferences() {
    const savedPrefs = localStorage.getItem('alertFilterPreferences');
    if (savedPrefs) {
      const preferences = JSON.parse(savedPrefs);
      alertFilters.forEach(cb => {
        // Si hay una preferencia guardada para este tipo, la aplicamos.
        // Si no, se queda con el valor por defecto del HTML (checked).
        if (preferences[cb.value] !== undefined) {
          cb.checked = preferences[cb.value];
        }
      });
    }
  }

  // Cargar la ruta del monorriel por defecto
  addMonorrielRoute();
  loadFilterPreferences(); // Cargar preferencias al iniciar

  // --- Lógica para el reporte de alertas ---

  // Activar el modo de reporte al hacer clic en el botón
  reportAlertButton.addEventListener('click', (e) => {
    e.preventDefault();
    mapElement.style.cursor = 'crosshair';
    map.once('click', onMapClickForReport);
    // Opcional: Notificar al usuario que debe hacer clic en el mapa
    alert('Haz clic en el mapa para seleccionar la ubicación de la alerta.');
  });

  // Capturar el clic en el mapa para obtener coordenadas
  function onMapClickForReport(e) {
    const previouslyFocusedElement = document.activeElement;

    const { lat, lng } = e.latlng;
    reportLatInput.value = lat;
    reportLngInput.value = lng;
    
    // Mostrar el modal y resetear el cursor
    reportModal.style.display = 'block';
    mapElement.style.cursor = '';
    closeModalButton.focus(); // Mover foco al modal

    // Guardar el elemento que abrió el modal para devolver el foco al cerrar
    reportModal.previouslyFocusedElement = previouslyFocusedElement;
  }

  // Cerrar el modal
  function closeModal() {
    reportModal.style.display = 'none';
    reportForm.reset();
    // Devolver el foco al elemento que abrió el modal
    if (reportModal.previouslyFocusedElement) {
      reportModal.previouslyFocusedElement.focus();
    }
  }

  closeModalButton.addEventListener('click', closeModal);
  window.addEventListener('click', (event) => {
    if (event.target == reportModal) {
      closeModal();
    }
  });

  // Lógica de accesibilidad para el modal (Escape y atrapar foco)
  reportModal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }

    if (e.key === 'Tab') {
      const focusableElements = reportModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else { // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  });

  // Enviar el formulario de reporte
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(reportForm);
    const data = {
      lat: parseFloat(formData.get('lat')),
      lng: parseFloat(formData.get('lng')),
      descripcion: formData.get('descripcion'),
      tipo: formData.get('tipo')
    };

    try {
      const response = await fetch('/api/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Error al enviar la alerta.');

      closeModal();
      alert('¡Gracias! Tu reporte ha sido enviado.');
      loadTrafficAlerts(); // Recargar las alertas para mostrar la nueva
    } catch (error) {
      console.error('Error en el reporte:', error);
      alert('Hubo un problema al enviar tu reporte. Por favor, inténtalo de nuevo.');
    }
  });

  // Event Listeners para la navegación
  document.getElementById('show-routes').addEventListener('click', addMonorrielRoute);
  document.getElementById('show-alerts').addEventListener('click', () => {
    // Limpiamos cualquier intervalo anterior para evitar duplicados
    if (alertRefreshInterval) {
      clearInterval(alertRefreshInterval);
    }
    // Carga inicial de alertas
    loadTrafficAlerts();
    // Establecemos la actualización automática cada 30 segundos
    alertRefreshInterval = setInterval(loadTrafficAlerts, 30000);
  });
  // Añadir listeners a los checkboxes de los filtros
  alertFilters.forEach(cb => cb.addEventListener('change', () => {
    saveFilterPreferences(); // Guardar preferencias al cambiar
    applyAlertFilters(); // Aplicar filtros inmediatamente
  }));

  // --- Lógica para geolocalización ---
  locateButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta la geolocalización.');
    } else {
      navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError);
    }
  });

  function onLocationSuccess(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // Centrar el mapa en la ubicación del usuario
    map.setView([lat, lng], 16);

    // Añadir un marcador en la ubicación del usuario
    const userLocationIcon = L.icon({
      iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
    });

    L.marker([lat, lng], { icon: userLocationIcon }).addTo(map)
      .bindPopup('<b>¡Estás aquí!</b>').openPopup();
  }

  function onLocationError(error) {
    alert(`No se pudo obtener tu ubicación. Error: ${error.message}`);
  }
});