// =================== CONFIG ===================
const API_URL = 'http://localhost:4000/api';

// =================== REFERENCIAS DOM ===================

// Pantalla principal (hero + buscador + categorías + grid)
const pantallaCatalogo   = document.getElementById('pantalla-catalogo');
const contenedor         = document.getElementById('productos');

// Navegación principal (header)
const btnGestionar       = document.getElementById('gestionar');
const btnCarritoNav      = document.getElementById('carrito-btn');
const btnHistorialNav    = document.getElementById('historial-btn');
const btnFavoritosNav    = document.getElementById('btn-favoritos');
const btnContactoNav     = document.getElementById('btn-contacto');

// Catálogo
const inputBusqueda      = document.getElementById('busqueda');

// Carrito
const seccionCarrito     = document.getElementById('carrito');
const listaCarrito       = document.getElementById('carrito-lista');
const totalSpan          = document.getElementById('total');
const carritoContador    = document.getElementById('cantidad-carrito');
const btnPagar           = document.getElementById('btn-pagar');
const btnVolverCatalogo  = document.getElementById('volver-catalogo');

// Gestión de productos
const formularioPanel    = document.getElementById('formulario-producto');
const formNuevo          = document.getElementById('form-nuevo');

// Historial de compras
const seccionHistorial   = document.getElementById('historial');
const historialLista     = document.getElementById('historial-lista');
const btnHistorialVolver = document.getElementById('historial-volver');

// Detalle de producto
const seccionDetalle     = document.getElementById('detalle-producto');
const detalleImagen      = document.getElementById('detalle-imagen');
const detalleNombre      = document.getElementById('detalle-nombre');
const detalleDescripcion = document.getElementById('detalle-descripcion');
const detallePrecioSpan  = document.getElementById('detalle-precio');
const btnDetalleAgregar  = document.getElementById('detalle-agregar');
const btnDetalleFavorito = document.getElementById('detalle-fav');
const btnDetalleVolver   = document.getElementById('detalle-volver');

// Favoritos (pantalla)
const seccionFavoritos   = document.getElementById('favoritos');
const favoritosLista     = document.getElementById('favoritos-lista');
const btnFavoritosVolver = document.getElementById('favoritos-volver');

// Contacto (pantalla)
const seccionContacto    = document.getElementById('pantalla-contacto');
const btnContactoVolver  = document.getElementById('contacto-volver');
// En este HTML ya no tienes formulario, solo info estática:
const contactoForm       = document.getElementById('contacto-form'); // será null, pero no pasa nada

// =================== ESTADO EN MEMORIA ===================

let productos      = [];
let carrito        = [];
let productoActual = null;

// Favoritos en localStorage
let favoritos = [];
try {
  favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
} catch (e) {
  favoritos = [];
}

// =================== HELPERS PANTALLAS ===================

const seccionesPantalla = [
  pantallaCatalogo,
  formularioPanel,
  seccionCarrito,
  seccionHistorial,
  seccionDetalle,
  seccionFavoritos,
  seccionContacto
].filter(Boolean);

function mostrarSolo(seccion) {
  seccionesPantalla.forEach(sec => {
    sec.classList.add('oculto');
  });
  if (seccion) {
    seccion.classList.remove('oculto');
  }
}

function irACatalogo() {
  mostrarSolo(pantallaCatalogo);
}

// =================== HELPERS BACKEND ===================

async function cargarProductos() {
  try {
    const res = await fetch(`${API_URL}/products`);
    productos = await res.json();
    renderProductos(productos);
  } catch (err) {
    console.error('Error cargando productos:', err);
  }
}

async function cargarHistorial() {
  try {
    const res = await fetch(`${API_URL}/orders`);
    const ordenes = await res.json();
    renderHistorial(ordenes);
  } catch (err) {
    console.error('Error cargando historial:', err);
    if (historialLista) {
      historialLista.innerHTML = '<p>Ocurrió un error al cargar el historial.</p>';
    }
  }
}

// =================== RENDER PRODUCTOS (TARJETAS) ===================

function renderProductos(lista) {
  contenedor.innerHTML = '';

  lista.forEach(prod => {
    const esFavorito = favoritos.some(f => f.id === prod.id);

    const div = document.createElement('article');
    div.classList.add('producto');
    div.dataset.id = prod.id;

    div.innerHTML = `
      <button class="card-fav" data-id="${prod.id}">
        ${esFavorito ? '♥' : '♡'}
      </button>
      <img src="${prod.imagen}" alt="${prod.nombre}">
      <h3>${prod.nombre}</h3>
      <p class="producto-precio">$${Number(prod.precio).toFixed(2)}</p>
      <p class="card-sub">Moda urbana • Tu Styles</p>
    `;

    contenedor.appendChild(div);
  });

  // Click en la tarjeta → abrir detalle
  document.querySelectorAll('.producto').forEach(card => {
    card.addEventListener('click', (e) => {
      // Si clican el corazón, no abrir detalle
      if (e.target.classList.contains('card-fav')) return;
      const id = Number(card.dataset.id);
      abrirDetalleProducto(id);
    });
  });

  // Click en el corazón → toggle favorito
  document.querySelectorAll('.card-fav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // no abrir detalle

      const id = Number(btn.dataset.id);
      const prod = productos.find(p => p.id === id);
      if (!prod) return;

      toggleFavorito(prod);
      renderProductos(productos); // repintar para actualizar corazones
    });
  });
}

// =================== DETALLE DE PRODUCTO ===================

function abrirDetalleProducto(id) {
  const prod = productos.find(p => p.id === id);
  if (!prod) return;

  productoActual = prod;

  if (detalleImagen) {
    detalleImagen.src = prod.imagen;
    detalleImagen.alt = prod.nombre;
  }
  if (detalleNombre) {
    detalleNombre.textContent = prod.nombre;
  }
  if (detalleDescripcion) {
    detalleDescripcion.textContent = prod.descripcion || 'Moda urbana • Tu Styles';
  }
  if (detallePrecioSpan) {
    detallePrecioSpan.textContent = Number(prod.precio).toFixed(2);
  }

  actualizarEstadoFavDetalle();
  mostrarSolo(seccionDetalle);
}

function actualizarEstadoFavDetalle() {
  if (!btnDetalleFavorito || !productoActual) return;

  const esFav = favoritos.some(f => f.id === productoActual.id);

  if (esFav) {
    btnDetalleFavorito.textContent = '★ En favoritos';
    btnDetalleFavorito.classList.add('activo');
  } else {
    btnDetalleFavorito.textContent = '☆ Guardar favorito';
    btnDetalleFavorito.classList.remove('activo');
  }
}

// =================== CARRITO (SOLO FRONTEND) ===================

function actualizarCarritoContador() {
  if (!carritoContador) return;
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
  carritoContador.textContent = totalItems;
}

function agregarAlCarrito(id) {
  const prod = typeof id === 'object' ? id : productos.find(p => p.id === id);
  if (!prod) return;

  const existente = carrito.find(item => item.id === prod.id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...prod, cantidad: 1 });
  }

  actualizarCarritoContador();
}

function renderCarrito() {
  if (!listaCarrito) return;

  listaCarrito.innerHTML = '';
  let total = 0;

  carrito.forEach(item => {
    const subtotal = Number(item.precio) * item.cantidad;
    total += subtotal;

    const row = document.createElement('div');
    row.classList.add('carrito-row');

    row.innerHTML = `
      <div class="carrito-producto">
        <img src="${item.imagen}" alt="${item.nombre}">
        <div>
          <p class="carrito-nombre">${item.nombre}</p>
          <p class="carrito-categoria">Moda urbana • Tu Styles</p>
        </div>
      </div>
      <div class="carrito-precio">$${Number(item.precio).toFixed(2)}</div>
      <div>
        <input
          type="number"
          min="1"
          value="${item.cantidad}"
          class="carrito-cantidad-input"
          data-id="${item.id}"
        >
      </div>
      <div class="carrito-total">$${subtotal.toFixed(2)}</div>
      <button class="carrito-eliminar" data-id="${item.id}">✕</button>
    `;

    listaCarrito.appendChild(row);
  });

  if (totalSpan) {
    totalSpan.textContent = total.toFixed(2);
  }

  // Cambiar cantidad
  document.querySelectorAll('.carrito-cantidad-input').forEach(input => {
    input.addEventListener('change', e => {
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

  // Eliminar
  document.querySelectorAll('.carrito-eliminar').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.target.dataset.id);
      carrito = carrito.filter(p => p.id !== id);
      renderCarrito();
      actualizarCarritoContador();
    });
  });
}

// =================== HISTORIAL DE COMPRAS ===================

function renderHistorial(ordenes) {
  if (!historialLista) return;

  historialLista.innerHTML = '';

  if (!ordenes || ordenes.length === 0) {
    historialLista.innerHTML = '<p>Aún no tienes compras registradas.</p>';
    return;
  }

  ordenes.forEach(orden => {
    const fecha = new Date(orden.fecha);
    const fechaFormateada = fecha.toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short'
    });

    const div = document.createElement('div');
    div.classList.add('compra');

    const itemsTexto = (orden.items || [])
      .map(it => `${it.cantidad}× ${it.nombre} ($${it.precio})`)
      .join('<br>');

    div.innerHTML = `
      <div class="compra-header">
        <span>Orden #${orden.id}</span>
        <span>${fechaFormateada}</span>
      </div>
      <div class="compra-total">Total: $${Number(orden.total).toFixed(2)}</div>
      <div class="compra-items">
        ${itemsTexto}
      </div>
    `;

    historialLista.appendChild(div);
  });
}

// =================== FAVORITOS ===================

function guardarFavoritos() {
  try {
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
  } catch (e) {
    console.warn('No se pudo guardar favoritos en localStorage', e);
  }
}

function toggleFavorito(prod) {
  const index = favoritos.findIndex(f => f.id === prod.id);
  if (index >= 0) {
    favoritos.splice(index, 1);
  } else {
    favoritos.push(prod);
  }
  guardarFavoritos();
}

function renderFavoritos() {
  if (!favoritosLista) return;

  favoritosLista.innerHTML = '';

  if (favoritos.length === 0) {
    favoritosLista.innerHTML = '<p>Aún no tienes productos favoritos.</p>';
    return;
  }

  favoritos.forEach(prod => {
    const card = document.createElement('article');
    card.classList.add('producto');

    card.innerHTML = `
      <div class="producto-imagen-wrapper">
        <img src="${prod.imagen}" alt="${prod.nombre}">
      </div>
      <h3>${prod.nombre}</h3>
      <p class="producto-precio">$${Number(prod.precio).toFixed(2)}</p>
      <p class="producto-sub">Moda urbana • Tu Styles</p>
    `;

    card.addEventListener('click', () => abrirDetalleProducto(prod.id));

    favoritosLista.appendChild(card);
  });
}

// =================== CONTACTO ===================

if (contactoForm) {
  contactoForm.addEventListener('submit', e => {
    e.preventDefault();

    const formData = new FormData(contactoForm);
    const nombre = formData.get('nombre') || '';
    const correo = formData.get('correo') || '';
    const mensaje = formData.get('mensaje') || '';

    alert(
      '✅ Mensaje enviado (simulado).\n\n' +
      `Nombre: ${nombre}\n` +
      `Correo: ${correo}\n\n` +
      `${mensaje}`
    );

    contactoForm.reset();
  });
}

// =================== BUSCADOR ===================

if (inputBusqueda) {
  inputBusqueda.addEventListener('input', e => {
    const texto = e.target.value.toLowerCase();
    const filtrados = productos.filter(p =>
      p.nombre.toLowerCase().includes(texto)
    );
    renderProductos(filtrados);
  });
}

// =================== FILTROS ===================

document.querySelectorAll('.categorias button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.categorias button').forEach(b =>
      b.classList.remove('activo')
    );
    btn.classList.add('activo');

    const cat = btn.getAttribute('data-cat');
    if (!cat || cat === 'todos') {
      renderProductos(productos);
    } else {
      const filtrados = productos.filter(p => p.categoria === cat);
      renderProductos(filtrados);
    }
  });
});

// =================== GESTIONAR PRODUCTOS ===================

if (btnGestionar && formularioPanel) {
  btnGestionar.addEventListener('click', () => {
    mostrarSolo(formularioPanel);
  });
}

if (formNuevo) {
  formNuevo.onsubmit = function (e) {
    e.preventDefault();

    const nombre     = document.getElementById('nombre').value;
    const precio     = parseFloat(document.getElementById('precio').value);
    const categoria  = document.getElementById('categoria').value;
    const archivoImg = document.getElementById('imagen').files[0];

    if (!archivoImg) {
      alert('Por favor selecciona una imagen.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async function (event) {
      const nuevaImagen = event.target.result;

      const nuevoProducto = {
        nombre,
        categoria,
        precio,
        imagen: nuevaImagen
      };

      try {
        const res = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevoProducto)
        });

        const productoGuardado = await res.json();
        productos.push(productoGuardado);
        renderProductos(productos);

        formNuevo.reset();
        irACatalogo();
      } catch (err) {
        console.error('Error guardando producto:', err);
        alert('Ocurrió un error guardando el producto.');
      }
    };

    reader.readAsDataURL(archivoImg);
  };
}

// =================== NAVEGACIÓN: CARRITO / HISTORIAL / FAVORITOS / CONTACTO ===================

// Carrito
if (btnCarritoNav && seccionCarrito) {
  btnCarritoNav.addEventListener('click', () => {
    renderCarrito();
    mostrarSolo(seccionCarrito);
  });
}

if (btnVolverCatalogo) {
  btnVolverCatalogo.addEventListener('click', () => {
    irACatalogo();
  });
}

// Historial
if (btnHistorialNav && seccionHistorial) {
  btnHistorialNav.addEventListener('click', async () => {
    await cargarHistorial();
    mostrarSolo(seccionHistorial);
  });
}

if (btnHistorialVolver) {
  btnHistorialVolver.addEventListener('click', () => {
    irACatalogo();
  });
}

// Favoritos
if (btnFavoritosNav && seccionFavoritos) {
  btnFavoritosNav.addEventListener('click', () => {
    renderFavoritos();
    mostrarSolo(seccionFavoritos);
  });
}

if (btnFavoritosVolver) {
  btnFavoritosVolver.addEventListener('click', () => {
    irACatalogo();
  });
}

// Contacto
if (btnContactoNav && seccionContacto) {
  btnContactoNav.addEventListener('click', () => {
    mostrarSolo(seccionContacto);
  });
}

if (btnContactoVolver) {
  btnContactoVolver.addEventListener('click', () => {
    irACatalogo();
  });
}

// Detalle volver
if (btnDetalleVolver) {
  btnDetalleVolver.addEventListener('click', () => {
    irACatalogo();
  });
}

// Detalle: agregar al carrito
if (btnDetalleAgregar) {
  btnDetalleAgregar.addEventListener('click', () => {
    if (!productoActual) return;
    agregarAlCarrito(productoActual.id);
    alert('Producto agregado al carrito.');
  });
}

// Detalle: favoritos
if (btnDetalleFavorito) {
  btnDetalleFavorito.addEventListener('click', () => {
    if (!productoActual) return;
    toggleFavorito(productoActual);
    actualizarEstadoFavDetalle();
    renderProductos(productos); // para actualizar corazones en catálogo
  });
}

// =================== SIMULAR PAGO ===================

if (btnPagar) {
  btnPagar.addEventListener('click', async () => {
    if (carrito.length === 0) {
      alert('Tu carrito está vacío. Agrega productos antes de pagar.');
      return;
    }

    const total = carrito.reduce(
      (acc, item) => acc + Number(item.precio) * item.cantidad,
      0
    );

    const payload = {
      items: carrito.map(item => ({
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad
      })),
      total
    };

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Error en el servidor al registrar la orden');
      }

      const orden = await res.json();

      alert(
        `✅ Pago simulado con éxito.\n\n` +
        `Número de orden: ${orden.id}\n` +
        `Total pagado: $${Number(orden.total).toFixed(2)}`
      );

      carrito = [];
      renderCarrito();
      actualizarCarritoContador();
    } catch (err) {
      console.error('Error simulando pago:', err);
      alert('Ocurrió un error al simular el pago. Inténtalo de nuevo.');
    }
  });
}

// =================== INICIALIZAR ===================

(async function init() {
  await cargarProductos();
  actualizarCarritoContador();
  irACatalogo();
})();