class UserRepositoryPort {
  async create(user) { throw new Error('No implementado'); }
  async findByEmail(email) { throw new Error('No implementado'); }
  async findById(id) { throw new Error('No implementado'); }
  async findAll() { throw new Error('No implementado'); }
  async findPendientes() { throw new Error('No implementado'); }
  async update(id, data) { throw new Error('No implementado'); }
  async updateByEmail(email, data) { throw new Error('No implementado'); }
  async asignarRol(id, rol, estado) { throw new Error('No implementado'); }
  async deleteById(id) { throw new Error('No implementado'); }
  async findByRol(rol) { throw new Error('No implementado'); }
}

module.exports = UserRepositoryPort;
