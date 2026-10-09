class Order {
  constructor({ id, usuarioId, items = [], total, estado = 'pendiente', createdAt }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.items = items.map(item => {
      const cantidad = Number(item.cantidad);
      const precioUnitario = Number(item.precioUnitario ?? item.precio_unitario);
      return {
        productoId: item.productoId ?? item.producto_id,
        nombre: item.nombre,
        artista: item.artista,
        imagenUrl: item.imagenUrl ?? item.imagen_url,
        cantidad,
        precioUnitario,
        subtotal: Number((cantidad * precioUnitario).toFixed(2)),
      };
    });
    this.total = total;
    this.estado = estado;
    this.createdAt = createdAt;
  }

  static validarCantidad(cantidad) {
    const num = Number(cantidad);
    if (!Number.isInteger(num) || num <= 0) {
      const err = new Error('La cantidad debe ser un número entero mayor a 0');
      err.statusCode = 400;
      throw err;
    }
    return num;
  }

  static validar({ usuarioId, items }) {
    if (!usuarioId) {
      const err = new Error('usuarioId es obligatorio');
      err.statusCode = 400;
      throw err;
    }
    if (!Array.isArray(items) || items.length === 0) {
      const err = new Error('El pedido debe tener al menos un producto');
      err.statusCode = 400;
      throw err;
    }
    for (const item of items) {
      if (!item.productoId) {
        const err = new Error('productoId es obligatorio en cada item');
        err.statusCode = 400;
        throw err;
      }
      Order.validarCantidad(item.cantidad);
    }
    return true;
  }

  static validarStock(stockDisponible, cantidadSolicitada) {
    if (stockDisponible !== undefined && stockDisponible !== null) {
      if (Number(stockDisponible) < Number(cantidadSolicitada)) {
        const err = new Error(`Stock insuficiente para realizar el pedido. Stock disponible: ${stockDisponible}, solicitado: ${cantidadSolicitada}`);
        err.statusCode = 400;
        throw err;
      }
    }
    return true;
  }

  static puedeCambiarEstado(estadoActual, accion) {
    if (accion === 'subir_comprobante' && !['pendiente_pago', 'verificando_pago'].includes(estadoActual)) {
      const err = new Error('Solo se pueden subir comprobantes a pedidos en estado pendiente de pago o verificando pago');
      err.statusCode = 409;
      throw err;
    }
    if (accion === 'validar_pago' && estadoActual !== 'verificando_pago') {
      const err = new Error('El pedido no está en espera de validación de pago');
      err.statusCode = 409;
      throw err;
    }
    if (accion === 'autorizar_envio' && estadoActual !== 'pagado') {
      const err = new Error('El pedido debe estar pagado y validado antes de enviarlo');
      err.statusCode = 409;
      throw err;
    }
    if (accion === 'rechazar' && ['en_envio', 'rechazado'].includes(estadoActual)) {
      const err = new Error(`El pedido no puede ser rechazado en estado '${estadoActual}'`);
      err.statusCode = 409;
      throw err;
    }
    return true;
  }

  static calcularTotal(precioUnitario, cantidad) {
    return Number((Number(precioUnitario) * Number(cantidad)).toFixed(2));
  }
}

module.exports = Order;
