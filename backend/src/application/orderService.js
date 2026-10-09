const Order = require('../domain/order');

class OrderService {
  constructor(orderRepository, productRepository, userRepository, notificationPort) {
    this.orderRepository = orderRepository;
    this.productRepository = productRepository;
    this.userRepository = userRepository;
    this.notificationPort = notificationPort;
  }

  async solicitarProducto({ usuarioId, items, clienteInfo }) {
    Order.validar({ usuarioId, items });
    const pedido = await this.orderRepository.crearYReservar({ usuarioId, items });
    
    // Enviar correos de forma asíncrona
    if (this.notificationPort && clienteInfo) {
      this.notificationPort.enviarInstruccionesPago(pedido, clienteInfo).catch(console.error);
      
      this.userRepository.findByRol('admin').then(admins => {
        const correosAdmins = admins.map(a => a.email);
        return this.notificationPort.notificarAdminNuevoPedido(pedido, clienteInfo, correosAdmins);
      }).catch(console.error);
    }
    
    return pedido;
  }

  async subirComprobante(pedidoId, usuarioId, comprobanteUrl) {
    const pedido = await this.orderRepository.findById(pedidoId);
    if (!pedido) {
      const err = new Error('Pedido no encontrado');
      err.statusCode = 404;
      throw err;
    }
    if (pedido.usuarioId !== usuarioId && pedido.usuario_id !== usuarioId) {
      const err = new Error('No tienes permiso para actualizar este pedido');
      err.statusCode = 403;
      throw err;
    }
    if (pedido.estado !== 'pendiente_pago' && pedido.estado !== 'verificando_pago') {
      const err = new Error('Solo se pueden subir comprobantes a pedidos pendientes de pago o en verificación');
      err.statusCode = 409;
      throw err;
    }
    return this.orderRepository.actualizarComprobante(pedidoId, comprobanteUrl);
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

  async obtenerPorId(id) {
    return this.orderRepository.findById(id);
  }
}

module.exports = OrderService;
