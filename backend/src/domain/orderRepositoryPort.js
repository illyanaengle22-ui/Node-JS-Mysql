class OrderRepositoryPort {
  async create(order) { throw new Error('No implementado'); }
  async findAll() { throw new Error('No implementado'); }
  async findByUsuario(usuarioId) { throw new Error('No implementado'); }
  async findById(id) { throw new Error('No implementado'); }
  async deleteById(id) { throw new Error('No implementado'); }
}

module.exports = OrderRepositoryPort;
