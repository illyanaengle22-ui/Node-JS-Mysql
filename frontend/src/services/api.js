const BASE_URL = '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function manejarRespuesta(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || data.msg || 'Error en la solicitud');
    error.codigo = data.codigo;
    throw error;
  }
  return data;
}

export const api = {
  // ---------- Captcha
  obtenerCaptcha: () => fetch(`${BASE_URL}/captcha`).then(manejarRespuesta),

  // ---------- Auth
  registrar: (payload) =>
    fetch(`${BASE_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(manejarRespuesta),

    crearUsuarioAdmin: (payload) =>
    fetch(`${BASE_URL}/usuarios/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    }).then(manejarRespuesta),

  cambiarRolUsuario: (id, payload) =>
    fetch(`${BASE_URL}/usuarios/${id}/rol`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    }).then(manejarRespuesta),

  login: (payload) =>
    fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(manejarRespuesta),

  // ---------- Usuarios
  listarUsuarios: () =>
    fetch(`${BASE_URL}/usuarios`, { headers: authHeaders() }).then(manejarRespuesta),

  listarUsuariosPendientes: () =>
    fetch(`${BASE_URL}/usuarios/pendientes`, { headers: authHeaders() }).then(manejarRespuesta),

    listarCatalogo: () =>
    fetch(`${BASE_URL}/productos/catalogo`, { headers: authHeaders() }).then(manejarRespuesta),
  
      listarMisSolicitudes: () =>
    fetch(`${BASE_URL}/pedidos/mis-solicitudes`, { headers: authHeaders() }).then(manejarRespuesta),
      
    aprobarUsuario: (id, rol) =>
    fetch(`${BASE_URL}/usuarios/${id}/aprobar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ rol }),
    }).then(manejarRespuesta),

  negarUsuario: (id) =>
    fetch(`${BASE_URL}/usuarios/${id}/negar`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(manejarRespuesta),

  actualizarUsuario: (id, payload) =>
    fetch(`${BASE_URL}/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    }).then(manejarRespuesta),

  eliminarUsuario: (id) =>
    fetch(`${BASE_URL}/usuarios/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(manejarRespuesta),

  // ---------- Productos
  crearProducto: (formData) =>
    fetch(`${BASE_URL}/productos`, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    }).then(manejarRespuesta),

  listarProductos: () =>
    fetch(`${BASE_URL}/productos`, { headers: authHeaders() }).then(manejarRespuesta),

  listarProductosPendientes: () =>
    fetch(`${BASE_URL}/productos/pendientes`, { headers: authHeaders() }).then(manejarRespuesta),

  listarProductosRecomendados: () =>
    fetch(`${BASE_URL}/productos/recomendados`, { headers: authHeaders() }).then(manejarRespuesta),

  aprobarProducto: (id) =>
    fetch(`${BASE_URL}/productos/${id}/aprobar`, {
      method: 'PUT',
      headers: authHeaders(),
    }).then(manejarRespuesta),

  rechazarProducto: (id) =>
    fetch(`${BASE_URL}/productos/${id}/rechazar`, {
      method: 'PUT',
      headers: authHeaders(),
    }).then(manejarRespuesta),

  actualizarProducto: (id, formDataOrPayload) => {
    // Si es FormData (editar con imagen), no mandar Content-Type
    // Si es JSON, sí mandar Content-Type
    const isFormData = formDataOrPayload instanceof FormData;
    return fetch(`${BASE_URL}/productos/${id}`, {
      method: 'PUT',
      headers: isFormData
        ? authHeaders()
        : { 'Content-Type': 'application/json', ...authHeaders() },
      body: isFormData ? formDataOrPayload : JSON.stringify(formDataOrPayload),
    }).then(manejarRespuesta);
  },

  eliminarProducto: (id) =>
    fetch(`${BASE_URL}/productos/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(manejarRespuesta),

  // ---------- Pedidos
  crearPedido: (payload) =>
    fetch(`${BASE_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(payload),
    }).then(manejarRespuesta),

  listarPedidos: () =>
    fetch(`${BASE_URL}/pedidos`, { headers: authHeaders() }).then(manejarRespuesta),

  obtenerPedido: (id) =>
    fetch(`${BASE_URL}/pedidos/${id}`, { headers: authHeaders() }).then(manejarRespuesta),

  aprobarPedido: (id) =>
    fetch(`${BASE_URL}/pedidos/${id}/aprobar`, {
      method: 'PUT',
      headers: authHeaders(),
    }).then(manejarRespuesta),

  rechazarPedido: (id) =>
    fetch(`${BASE_URL}/pedidos/${id}/rechazar`, {
      method: 'PUT',
      headers: authHeaders(),
    }).then(manejarRespuesta),

  eliminarPedido: (id) =>
    fetch(`${BASE_URL}/pedidos/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(manejarRespuesta),

  subirComprobante: (id, file) => {
    const formData = new FormData();
    formData.append('comprobante', file);
    return fetch(`${BASE_URL}/pedidos/${id}/comprobante`, {
      method: 'PUT',
      headers: authHeaders(),
      body: formData,
    }).then(manejarRespuesta);
  },

  // ---------- Reportes analíticos (solo admin)
  reporteTopProductos: ({ desde, hasta, limite = 5 }) =>
    fetch(
      `${BASE_URL}/reportes/top-productos?desde=${desde}&hasta=${hasta}&limite=${limite}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),

  reporteIngresos: ({ desde, hasta, agrupar = 'mes' }) =>
    fetch(
      `${BASE_URL}/reportes/ingresos?desde=${desde}&hasta=${hasta}&agrupar=${agrupar}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),

  reporteEstados: ({ desde, hasta }) =>
    fetch(
      `${BASE_URL}/reportes/estados?desde=${desde}&hasta=${hasta}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),

  reporteTicketPromedio: ({ desde, hasta }) =>
    fetch(
      `${BASE_URL}/reportes/ticket-promedio?desde=${desde}&hasta=${hasta}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),

  reporteResumen: ({ desde, hasta }) =>
    fetch(
      `${BASE_URL}/reportes/resumen?desde=${desde}&hasta=${hasta}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),

  // ---------- Reportes analíticos (rol producto)
  misVentasResumen: ({ desde, hasta }) =>
    fetch(
      `${BASE_URL}/reportes/mis-ventas/resumen?desde=${desde}&hasta=${hasta}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),

  misVentasIngresos: ({ desde, hasta, agrupar = 'mes' }) =>
    fetch(
      `${BASE_URL}/reportes/mis-ventas/ingresos?desde=${desde}&hasta=${hasta}&agrupar=${agrupar}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),

  misVentasTop: ({ desde, hasta, limite = 5 }) =>
    fetch(
      `${BASE_URL}/reportes/mis-ventas/top?desde=${desde}&hasta=${hasta}&limite=${limite}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),

  misVentasStockBajo: () =>
    fetch(`${BASE_URL}/reportes/mis-ventas/stock-bajo`, {
      headers: authHeaders(),
    }).then(manejarRespuesta),

  misVentasEstados: ({ desde, hasta }) =>
    fetch(
      `${BASE_URL}/reportes/mis-ventas/estados?desde=${desde}&hasta=${hasta}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),

  // ---------- Reportes analíticos (rol pedido)
  misComprasResumen: ({ desde, hasta }) =>
    fetch(
      `${BASE_URL}/reportes/mis-compras/resumen?desde=${desde}&hasta=${hasta}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),

  misComprasGasto: ({ desde, hasta, agrupar = 'mes' }) =>
    fetch(
      `${BASE_URL}/reportes/mis-compras/gasto?desde=${desde}&hasta=${hasta}&agrupar=${agrupar}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),

  misComprasEstados: ({ desde, hasta }) =>
    fetch(
      `${BASE_URL}/reportes/mis-compras/estados?desde=${desde}&hasta=${hasta}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),

  misComprasTop: ({ desde, hasta, limite = 5 }) =>
    fetch(
      `${BASE_URL}/reportes/mis-compras/top?desde=${desde}&hasta=${hasta}&limite=${limite}`,
      { headers: authHeaders() }
    ).then(manejarRespuesta),
};

export { BASE_URL };
