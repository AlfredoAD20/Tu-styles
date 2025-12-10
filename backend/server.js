// backend/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

// ================== MIDDLEWARES ==================
app.use(cors());

// Aumentamos límite del JSON porque mandas imágenes en base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ================== RUTAS DE ARCHIVOS ==================
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CUSTOMER_FILE = path.join(DATA_DIR, 'customer.json');

// Asegurarnos de que la carpeta y archivos existan
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(PRODUCTS_FILE)) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify([], null, 2), 'utf8');
}

if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), 'utf8');
}

// Helpers para leer / escribir JSON
function leerJson(ruta) {
  const data = fs.readFileSync(ruta, 'utf8');
  if (!data) return [];
  return JSON.parse(data);
}

function escribirJson(ruta, contenido) {
  fs.writeFileSync(ruta, JSON.stringify(contenido, null, 2), 'utf8');
}

// ================== ENDPOINTS DE PRODUCTOS ==================

// GET /api/products - listar productos
app.get('/api/products', (req, res) => {
  const productos = leerJson(PRODUCTS_FILE);
  res.json(productos);
});

// POST /api/products - agregar producto nuevo
app.post('/api/products', (req, res) => {
  const productos = leerJson(PRODUCTS_FILE);
  const nuevo = req.body;

  const newId = Date.now(); // id sencillo
  const productoConId = { id: newId, ...nuevo };

  productos.push(productoConId);
  escribirJson(PRODUCTS_FILE, productos);

  res.status(201).json(productoConId);
});

// (Opcional) PUT /api/products/:id - actualizar producto
app.put('/api/products/:id', (req, res) => {
  const productos = leerJson(PRODUCTS_FILE);
  const id = parseInt(req.params.id, 10);
  const index = productos.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  productos[index] = { ...productos[index], ...req.body };
  escribirJson(PRODUCTS_FILE, productos);

  res.json(productos[index]);
});

// (Opcional) DELETE /api/products/:id - eliminar producto
app.delete('/api/products/:id', (req, res) => {
  const productos = leerJson(PRODUCTS_FILE);
  const id = parseInt(req.params.id, 10);
  const filtrados = productos.filter(p => p.id !== id);

  if (filtrados.length === productos.length) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  escribirJson(PRODUCTS_FILE, filtrados);
  res.json({ ok: true });
});

// ================== ENDPOINTS DE PERFIL DE CLIENTE ==================

// GET /api/customer - obtener perfil actual (un solo cliente)
app.get('/api/customer', (req, res) => {
  try {
    const perfil = leerJson(CUSTOMER_FILE);
    // Si el archivo está vacío o con {}, regresamos objeto vacío
    if (!perfil || typeof perfil !== 'object') {
      return res.json({});
    }
    res.json(perfil);
  } catch (e) {
    // Si el archivo no existe o hay error, regresamos objeto vacío
    res.json({});
  }
});

// POST /api/customer - crear o actualizar perfil
app.post('/api/customer', (req, res) => {
  const data = req.body || {};

  const perfil = {
    nombre:   data.nombre   || '',
    email:    data.email    || '',
    telefono: data.telefono || '',
    direccion:data.direccion|| '',
    ciudad:   data.ciudad   || '',
    cp:       data.cp       || '',
    actualizadoEn: new Date().toISOString()
  };

  escribirJson(CUSTOMER_FILE, perfil);
  res.status(201).json(perfil);
});

// ================== ENDPOINTS DE ÓRDENES ==================

// GET /api/orders - historial de compras
app.get('/api/orders', (req, res) => {
  const ordenes = leerJson(ORDERS_FILE);
  res.json(ordenes);
});

// POST /api/orders - crear nueva orden (simulación de pago)
app.post('/api/orders', (req, res) => {
  const { items, total } = req.body;
  const ordenes = leerJson(ORDERS_FILE);

  const nuevaOrden = {
    id: Date.now(),
    fecha: new Date().toISOString(),
    items,
    total,
  };

  ordenes.push(nuevaOrden);
  escribirJson(ORDERS_FILE, ordenes);

  res.status(201).json(nuevaOrden);
});

// ================== INICIAR SERVIDOR ==================
app.listen(PORT, () => {
  console.log(`✅ Backend escuchando en http://localhost:${PORT}`);
});