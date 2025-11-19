// =================== CONFIG ===================
const API_URL = 'http://localhost:4000/api';

// =================== REFERENCIAS DOM ===================
const contenedor = document.getElementById('productos');
const carritoContador = document.getElementById('cantidad-carrito');
const seccionCarrito = document.getElementById('carrito');
const listaCarrito = document.getElementById('carrito-lista');
const totalSpan = document.getElementById('total');
const formularioPanel = document.getElementById("formulario-producto");
const catalogo = document.getElementById("catalogo");
const inputBusqueda = document.getElementById('busqueda');

// Estado en memoria (frontend)
let productos = [];
let carrito = [];

// =================== HELPERS BACKEND ===================
async function cargarProductos() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error('Error HTTP ' + res.status);
    productos = await res.json();
    renderProductos(productos);
  } catch (err) {
    console.error('Error cargando productos:', err);
    alert('No se pudieron cargar los productos del servidor.');
  }
}

// =================== RENDER PRODUCTOS ===================
function renderProductos(lista) {
  contenedor.innerHTML = '';
  lista.forEach(prod => {
    const div = document.createElement('div');
    div.classList.add('producto');
    div.innerHTML = `
      <img src="${prod.imagen}" alt="${prod.nombre}">
      <h3>${prod.nombre}</h3>
      <p>$${prod.precio}</p>
      <button onclick="agregarAlCarrito(${prod.id})">Agregar</button>
    `;
    contenedor.appendChild(div);
  });
}

// =================== CARRITO (FRONTEND) ===================
function actualizarCarritoContador() {
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  carritoContador.textContent = totalItems;
}

function agregarAlCarrito(id) {
  const prod = productos.find(p => p.id === id);
  if (!prod) return;

  const existente = carrito.find(item => item.id === id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...prod, cantidad: 1 });
  }

  actualizarCarritoContador();
}

// Carrito estilo tabla profesional
function renderCarrito() {
  listaCarrito.innerHTML = '';
  let total = 0;

  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;

    const row = document.createElement('div');
    row.classList.add('cart-row');
    row.innerHTML = `
      <div class="cart-check">
        <input type="checkbox" checked>
      </div>
      <div class="cart-product">
        <img src="${item.imagen}" alt="${item.nombre}">
        <div>
          <p class="cart-name">${item.nombre}</p>
          <p class="cart-desc">Moda urbana • Tu Styles</p>
        </div>
      </div>
      <div class="cart-price">$${item.precio.toFixed(2)}</div>
      <div class="cart-qty">
        <input type="number" min="1" value="${item.cantidad}" data-id="${item.id}">
      </div>
      <div class="cart-item-total">$${subtotal.toFixed(2)}</div>
      <div class="cart-remove">
        <button class="btn-remove" data-id="${item.id}">✕</button>
      </div>
    `;
    listaCarrito.appendChild(row);
  });

  totalSpan.textContent = total.toFixed(2);

  // Cambiar cantidad
  document.querySelectorAll('.cart-qty input').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      let valor = parseInt(e.target.value, 10);
      if (isNaN(valor) || valor < 1) valor = 1;
      e.target.value = valor;

      const item = carrito.find(p => p.id === id);
      if (item) {
        item.cantidad = valor;
        renderCarrito();
        actualizarCarritoContador();
      }
    });
  });

  // Eliminar producto del carrito
  document.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = Number(e.target.dataset.id);
      carrito = carrito.filter(p => p.id !== id);
      renderCarrito();
      actualizarCarritoContador();
    });
  });
}

// Mostrar carrito como pantalla aparte
document.getElementById('carrito-btn').onclick = () => {
  renderCarrito();
  catalogo.classList.add("oculto");
  formularioPanel.classList.add("oculto");
  seccionCarrito.classList.remove("oculto");
};

// Volver del carrito al catálogo
document.getElementById("volver-catalogo").onclick = () => {
  seccionCarrito.classList.add("oculto");
  formularioPanel.classList.add("oculto");
  catalogo.classList.remove("oculto");
};

// =================== BUSCADOR ===================
inputBusqueda.addEventListener('input', e => {
  const texto = e.target.value.toLowerCase();
  const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(texto));
  renderProductos(filtrados);
});

// =================== FILTROS ===================
document.querySelectorAll('.categorias button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.categorias button').forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');

    const cat = btn.getAttribute('data-cat');
    if (cat === 'todos') {
      renderProductos(productos);
    } else {
      const filtrados = productos.filter(p => p.categoria === cat);
      renderProductos(filtrados);
    }
  };
});

// =================== GESTIONAR PRODUCTOS (PANTALLA APARTE) ===================
document.getElementById("gestionar").onclick = () => {
  catalogo.classList.add("oculto");
  seccionCarrito.classList.add("oculto");
  formularioPanel.classList.remove("oculto");
};

// =================== AGREGAR NUEVO PRODUCTO (BACKEND) ===================
document.getElementById("form-nuevo").onsubmit = function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const precio = parseFloat(document.getElementById("precio").value);
  const categoria = document.getElementById("categoria").value;
  const archivoImg = document.getElementById("imagen").files[0];

  if (!archivoImg) {
    alert("Por favor selecciona una imagen.");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (event) {
    const nuevaImagen = event.target.result;

    const nuevoProducto = {
      nombre,
      categoria,
      precio,
      imagen: nuevaImagen // base64
    };

    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProducto),
      });

      if (!res.ok) throw new Error('Error HTTP ' + res.status);
      const productoGuardado = await res.json();

      productos.push(productoGuardado);
      renderProductos(productos);

      e.target.reset();
      formularioPanel.classList.add("oculto");
      catalogo.classList.remove("oculto");
    } catch (err) {
      console.error('Error guardando producto:', err);
      alert('Ocurrió un error guardando el producto en el servidor.');
    }
  };

  reader.readAsDataURL(archivoImg);
};

// =================== INICIALIZAR ===================
(async function init() {
  await cargarProductos();
  actualizarCarritoContador();
})();
