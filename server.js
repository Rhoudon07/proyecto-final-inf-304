const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises; // Usamos la versión de promesas de fs

const app = express();
const PORT = 3000;

// --- Almacenamiento en memoria para las alertas ---
let alertas = [];
const ALERTA_EXPIRATION_MS = 60 * 60 * 1000; // 1 hora

// --- Middlewares ---
// Habilita CORS para permitir que tu frontend haga peticiones
app.use(cors());
// Permite al servidor entender peticiones con cuerpo en formato JSON
app.use(express.json());

// --- Servir archivos estáticos ---
// Sirve los archivos dentro de las carpetas 'js' y 'data'
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/data', express.static(path.join(__dirname, 'data')));


// --- Rutas (Endpoints) de la API ---

// Endpoint para obtener los datos de la Línea 1 del Monorriel
app.get('/api/rutas/monorriel/linea1', async (req, res) => {
  try {
    const geojsonPath = path.join(__dirname, 'data', 'linea1_monorriel.geojson');
    const data = await fs.readFile(geojsonPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Error al leer el archivo GeoJSON:", error);
    res.status(500).json({ message: "Error interno del servidor al obtener la ruta." });
  }
});

// Endpoint para recibir una nueva alerta de tráfico
app.post('/api/alertas', (req, res) => {
  const { lat, lng, descripcion, tipo } = req.body;

  if (!lat || !lng || !descripcion || !tipo) {
    return res.status(400).json({ message: "Faltan datos para crear la alerta." });
  }

  const nuevaAlerta = {
    id: Date.now(), // ID simple basado en el timestamp
    lat,
    lng,
    tipo,
    descripcion,
    createdAt: new Date()
  };

  alertas.push(nuevaAlerta);
  console.log("Nueva alerta recibida:", nuevaAlerta);
  res.status(201).json(nuevaAlerta);
});

// Endpoint para obtener todas las alertas activas
app.get('/api/alertas', (req, res) => {
  const ahora = new Date();
  const alertasActivas = alertas.filter(alerta => ahora - new Date(alerta.createdAt) < ALERTA_EXPIRATION_MS);
  res.json(alertasActivas);
});

// --- Ruta principal para servir el index.html ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});