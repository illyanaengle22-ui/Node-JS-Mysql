class Order {
  constructor({ id, usuarioId, productoId, cantidad = 1, total, estado = 'pendiente', createdAt }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.productoId = productoId;
    this.cantidad = Number(cantidad);
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

  static validar({ productoId, usuarioId, cantidad }) {
    if (!productoId) {
      const err = new Error('productoId es obligatorio');
      err.statusCode = 400;
      throw err;
    }
    if (!usuarioId) {
      const err = new Error('usuarioId es obligatorio');
      err.statusCode = 400;
      throw err;
    }
    Order.validarCantidad(cantidad);
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
