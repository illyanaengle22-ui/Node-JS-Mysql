class NotificationPort {
  async enviarInstruccionesPago(pedido, cliente) {
    throw new Error('Método no implementado: enviarInstruccionesPago');
  }

  async notificarAdminNuevoPedido(pedido, cliente, correosAdmins) {
    throw new Error('Método no implementado: notificarAdminNuevoPedido');
  }
}

module.exports = NotificationPort;
