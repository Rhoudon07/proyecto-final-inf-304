# Movilidad Urbana Santiago

## Descripción

**Movilidad Urbana Santiago** es una aplicación web interactiva diseñada para visualizar y gestionar la información de movilidad en la ciudad de Santiago. El objetivo es proporcionar a los ciudadanos y planificadores urbanos una herramienta centralizada para entender mejor el flujo del transporte público y las condiciones del tráfico en tiempo real.

## Características

- **Mapa Interactivo**: Visualización de la ciudad utilizando Leaflet.js sobre OpenStreetMap.
- **Ruta del Monorriel**: Muestra la ruta de la Línea 1 del Monorriel, junto con sus estaciones y puntos de interconexión.
- **Alertas de Tráfico en Tiempo Real**:
    - Los usuarios pueden reportar alertas de tráfico (Accidentes, Congestión, Obras) directamente en el mapa.
    - Las alertas se muestran con íconos de diferentes colores según su tipo.
    - La información de las alertas se actualiza automáticamente cada 30 segundos.
- **Panel de Alertas**: Un panel lateral lista todas las alertas activas, mostrando su tipo, descripción y hace cuánto tiempo fueron reportadas.
- **Filtros Personalizables**: Los usuarios pueden filtrar las alertas por tipo. Las preferencias se guardan en el navegador y se recuerdan entre visitas.
- **Geolocalización**: Un botón permite a los usuarios centrar el mapa en su ubicación actual.
- **Accesibilidad**: Mejoras en el panel de alertas y el modal de reporte para una mejor navegación con teclado y compatibilidad con lectores de pantalla.
- **Página "Acerca de"**: Una sección informativa que describe el propósito y las funcionalidades del proyecto.

## Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), [Leaflet.js](https://leafletjs.com/)
- **Backend**: [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/)

## Instalación y Puesta en Marcha

Sigue estos pasos para ejecutar el proyecto en tu máquina local.

1.  **Clona el repositorio:**
    ```bash
    git clone <URL-del-repositorio>
    cd Proyecto-Final-INF-304
    ```

2.  **Instala las dependencias del backend:**
    ```bash
    npm install
    ```

3.  **Inicia el servidor:**
    ```bash
    node server.js
    ```

4.  **Abre la aplicación en tu navegador:**
    Visita [http://localhost:3000](http://localhost:3000)

## Endpoints de la API

- `GET /api/rutas/monorriel/linea1`: Devuelve los datos GeoJSON de la ruta del monorriel.
- `GET /api/alertas`: Devuelve una lista de las alertas de tráfico activas.
- `POST /api/alertas`: Permite crear una nueva alerta de tráfico.