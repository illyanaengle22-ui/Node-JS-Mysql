const Order = require('../domain/order');

class OrderService {
  constructor(orderRepository, productRepository) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
  }


  async solicitarProducto({ usuarioId, productoId, cantidad = 1 }) {
    Order.validar({ productoId, usuarioId, cantidad });

    const producto = await this.productRepository.findById(productoId);
    if (!producto) throw new Error('Producto no encontrado');
    if (producto.estado !== 'aprobado') {
      throw new Error('Este producto todavía no está disponible en el catálogo');
    }

    // Regla de negocio: comprobación de stock disponible al ordenar
    Order.validarStock(producto.stock, cantidad);

    const total = Order.calcularTotal(producto.precio, cantidad);
    return this.orderRepository.create({ usuarioId, productoId, cantidad, total });
  }

  async aprobarPedido(id) {
    const pedido = await this.orderRepository.findById(id);
    if (!pedido) throw new Error('Pedido no encontrado');

    const producto = await this.productRepository.findById(pedido.productoId);
    if (producto) {
      Order.validarStock(producto.stock, pedido.cantidad);
      const nuevoStock = Math.max(0, Number(producto.stock) - Number(pedido.cantidad));
      await this.productRepository.update(producto.id, { stock: nuevoStock });
    }

    return this.orderRepository.updateEstado(id, 'aprobado');
  }

  async rechazarPedido(id) {
    const pedido = await this.orderRepository.findById(id);
    if (!pedido) throw new Error('Pedido no encontrado');
    return this.orderRepository.updateEstado(id, 'rechazado');
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

  async eliminarPedido(id) {
    const eliminado = await this.orderRepository.deleteById(id);
    if (!eliminado) throw new Error('Pedido no encontrado');
    return true;
  }
}

module.exports = OrderService;
