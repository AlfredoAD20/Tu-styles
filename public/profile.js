// =================== CONFIG (reuse endpoint) ===================
const API_URL_PROFILE = 'http://localhost:4000/api';

// =================== REFERENCIAS DOM PERFIL ===================
const seccionPerfil    = document.getElementById('perfil');
const btnPerfilNav     = document.getElementById('perfil-btn');
const perfilForm       = document.getElementById('perfil-form');
const perfilNombre     = document.getElementById('perfil-nombre');
const perfilEmail      = document.getElementById('perfil-email');
const perfilTelefono   = document.getElementById('perfil-telefono');
const perfilDireccion  = document.getElementById('perfil-direccion');
const perfilCiudad     = document.getElementById('perfil-ciudad');
const perfilCP         = document.getElementById('perfil-cp');

const btnPerfilVolver  = document.getElementById('perfil-volver');

// Usaremos las funciones globales de app.js:
// - mostrarSolo(seccion)
// - irACatalogo()
// - carrito (array)
// - renderCarrito()
// - actualizarCarritoContador()
// - seccionCarrito (carrito)

// =================== ESTADO PERFIL ===================
let perfilCliente = null;
let pagoPendiente = false; // para saber si venimos de "Simular pago"

// =================== HELPERS PERFIL ===================

async function cargarPerfilDesdeServidor() {
  try {
    const res = await fetch(`${API_URL_PROFILE}/customer`);
    if (!res.ok) return;

    const data = await res.json();
    if (data && Object.keys(data).length > 0) {
      perfilCliente = data;

      if (perfilNombre)    perfilNombre.value    = data.nombre   || '';
      if (perfilEmail)     perfilEmail.value     = data.email    || '';
      if (perfilTelefono)  perfilTelefono.value  = data.telefono || '';
      if (perfilDireccion) perfilDireccion.value = data.direccion|| '';
      if (perfilCiudad)    perfilCiudad.value    = data.ciudad   || '';
      if (perfilCP)        perfilCP.value        = data.cp       || '';
    }
  } catch (err) {
    console.error('Error cargando perfil:', err);
  }
}

async function guardarPerfilEnServidor(datos) {
  const res = await fetch(`${API_URL_PROFILE}/customer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });

  if (!res.ok) {
    throw new Error('Error guardando perfil en el servidor');
  }

  const guardado = await res.json();
  perfilCliente = guardado;
  return guardado;
}

// =================== NAVEGACIÓN PERFIL ===================

if (btnPerfilNav && seccionPerfil) {
  btnPerfilNav.addEventListener('click', async () => {
    await cargarPerfilDesdeServidor();
    if (typeof mostrarSolo === 'function') {
      mostrarSolo(seccionPerfil);
    } else if (seccionPerfil) {
      seccionPerfil.classList.remove('oculto');
    }
  });
}

if (btnPerfilVolver) {
  btnPerfilVolver.addEventListener('click', () => {
    if (typeof irACatalogo === 'function') {
      irACatalogo();
    } else if (seccionPerfil) {
      seccionPerfil.classList.add('oculto');
    }
  });
}

// =================== SUBMIT FORM PERFIL ===================

if (perfilForm) {
  perfilForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const datos = {
      nombre:    perfilNombre?.value?.trim()    || '',
      email:     perfilEmail?.value?.trim()     || '',
      telefono:  perfilTelefono?.value?.trim()  || '',
      direccion: perfilDireccion?.value?.trim() || '',
      ciudad:    perfilCiudad?.value?.trim()    || '',
      cp:        perfilCP?.value?.trim()        || '',
    };

    try {
      await guardarPerfilEnServidor(datos);
      alert('✅ Perfil guardado correctamente.');

      if (pagoPendiente) {
        // Veníamos de "Simular pago"
        pagoPendiente = false;
        await procesarPagoConPerfil();
      } else if (typeof irACatalogo === 'function') {
        irACatalogo();
      }
    } catch (err) {
      console.error('Error guardando perfil:', err);
      alert('Ocurrió un error al guardar el perfil. Intenta de nuevo.');
    }
  });
}

// =================== INTERCEPTAR BOTÓN DE PAGO ===================

// Truco: clonamos el botón para eliminar los listeners de app.js sin tocar app.js
let btnPagarPerfil = document.getElementById('btn-pagar');

if (btnPagarPerfil) {
  const clon = btnPagarPerfil.cloneNode(true);
  btnPagarPerfil.parentNode.replaceChild(clon, btnPagarPerfil);
  btnPagarPerfil = clon;

  btnPagarPerfil.addEventListener('click', async () => {
    if (!Array.isArray(carrito) || carrito.length === 0) {
      alert('Tu carrito está vacío. Agrega productos antes de pagar.');
      return;
    }

    // Si NO hay perfil o faltan campos básicos → obligamos a llenarlo
    if (
      !perfilCliente ||
      !perfilCliente.nombre ||
      !perfilCliente.direccion ||
      !perfilCliente.ciudad ||
      !perfilCliente.cp
    ) {
      pagoPendiente = true;
      await cargarPerfilDesdeServidor();

      if (typeof mostrarSolo === 'function' && seccionPerfil) {
        mostrarSolo(seccionPerfil);
      } else if (seccionPerfil) {
        seccionPerfil.classList.remove('oculto');
      }

      alert('Antes de completar tu compra, llena tu perfil de envío.');
      return;
    }

    // Si ya hay perfil completo → procesar pago directo
    await procesarPagoConPerfil();
  });
}

// =================== PROCESAR PAGO (USA MISMO BACKEND) ===================

async function procesarPagoConPerfil() {
  if (!Array.isArray(carrito) || carrito.length === 0) {
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
    // podríamos mandar también perfilCliente si quisieras guardarlo en cada orden
    // perfil: perfilCliente
  };

  try {
    const res = await fetch(`${API_URL_PROFILE}/orders`, {
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

    // Limpiar carrito y refrescar vista
    carrito = [];
    if (typeof renderCarrito === 'function') {
      renderCarrito();
    }
    if (typeof actualizarCarritoContador === 'function') {
      actualizarCarritoContador();
    }

    // Opcional: mandar al historial o catálogo
    if (typeof irACatalogo === 'function') {
      irACatalogo();
    }
  } catch (err) {
    console.error('Error simulando pago:', err);
    alert('Ocurrió un error al simular el pago. Inténtalo de nuevo.');
  }
}