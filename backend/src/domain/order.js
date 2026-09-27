class Order {
  constructor({ id, usuarioId, productoId, cantidad = 1, total, estado = 'pendiente', createdAt }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.productoId = productoId;
    this.cantidad = cantidad;
    this.total = total;
    this.estado = estado;
    this.createdAt = createdAt;
  }

  static validar({ productoId, usuarioId, cantidad }) {
    if (!productoId) throw new Error('productoId es obligatorio');
    if (!usuarioId) throw new Error('usuarioId es obligatorio');
    if (cantidad !== undefined && (Number.isNaN(Number(cantidad)) || Number(cantidad) <= 0)) {
      throw new Error('La cantidad debe ser mayor a 0');
    }
    return true;
  }

  static calcularTotal(precioUnitario, cantidad) {
    return Number((Number(precioUnitario) * Number(cantidad)).toFixed(2));
  }
}

module.exports = Order;
