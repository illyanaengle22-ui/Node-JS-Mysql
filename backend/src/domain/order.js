class Order {
  constructor({ id, usuarioId, items = [], total, estado = 'pendiente', createdAt }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.items = items.map(item => ({
      productoId: item.productoId || item.producto_id,
      cantidad: Number(item.cantidad),
      precioUnitario: item.precioUnitario ? Number(item.precioUnitario) : null,
      nombre: item.nombre,
      artista: item.artista,
      imagenUrl: item.imagenUrl || item.imagen_url
    }));
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

  static puedeCambiarEstado(estadoActual) {
    if (estadoActual !== 'pendiente') {
      const err = new Error(`El pedido ya fue procesado (estado actual: '${estadoActual}'). Solo se pueden procesar pedidos en estado 'pendiente'`);
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
