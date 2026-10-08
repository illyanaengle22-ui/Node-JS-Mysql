const Order = require('../domain/order');

class OrderService {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }

  async solicitarProducto({ usuarioId, productoId, cantidad = 1 }) {
    Order.validar({ productoId, usuarioId, cantidad });
    return this.orderRepository.crearYReservar({ usuarioId, productoId, cantidad });
  }

  async aprobarPedido(id) {
    return this.orderRepository.aprobar(id);
  }

  async rechazarPedido(id) {
    return this.orderRepository.rechazarYLiberar(id);
  }

  async eliminarPedido(id) {
    return this.orderRepository.eliminarYLiberar(id);
  }

  async listarTodos() {
    return this.orderRepository.findAll();
  }

  async listarSolicitudesDeMisProductos(vendedorId) {
    return this.orderRepository.findByCreadorProducto(vendedorId);
  }

  async listarPorUsuario(usuarioId) {
    return this.orderRepository.findByUsuario(usuarioId);
  }
}

module.exports = OrderService;
