class OrderRepositoryPort {
  async crearYReservar({ usuarioId, productoId, cantidad }) { throw new Error('No implementado'); }
  async aprobar(id) { throw new Error('No implementado'); }
  async rechazarYLiberar(id) { throw new Error('No implementado'); }
  async eliminarYLiberar(id) { throw new Error('No implementado'); }
  async findAll() { throw new Error('No implementado'); }
  async findByUsuario(usuarioId) { throw new Error('No implementado'); }
  async findByCreadorProducto(vendedorId) { throw new Error('No implementado'); }
  async findById(id) { throw new Error('No implementado'); }
}

module.exports = OrderRepositoryPort;
