class ProductRepositoryPort {
  async create(product) { throw new Error('No implementado'); }
  async findById(id) { throw new Error('No implementado'); }
  async findAll() { throw new Error('No implementado'); }
  async findActivos() { throw new Error('No implementado'); }
  async findPendientes() { throw new Error('No implementado'); }
  async findByCreador(creadoPor) { throw new Error('No implementado'); }
  async update(id, data) { throw new Error('No implementado'); }
  async cambiarEstado(id, estado) { throw new Error('No implementado'); }
  async deleteById(id) { throw new Error('No implementado'); }
}

module.exports = ProductRepositoryPort;
