class UserRepositoryPort {
  async create(user) {
    throw new Error("Método create() no implementado");
  }

  async findByEmail(email) {
    throw new Error("Método findByEmail() no implementado");
  }
  async findAll(){
	throw new Error("Metodo findAll() no implementado");
  }
  async update(id,datos){
  	throw new Error("Metodo update() no implementado");
 }
  async deleteById(id){
	throw new Error("Metodo deleteById() no implementado");
 }
}

module.exports = UserRepositoryPort;
