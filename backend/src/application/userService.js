const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../domain/user");

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async registerUser({ nombre, email, password }) {
    if (!nombre || !email || !password) {
      const error = new Error("Faltan datos");
      error.code = "VALIDATION_ERROR";
      throw error;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ nombre, email, passwordHash });
    await this.userRepository.create(user);
  }

  async loginUser({ email, password }) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      const error = new Error("Credenciales incorrectas");
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      const error = new Error("Credenciales incorrectas");
      error.code = "INVALID_CREDENTIALS";
      throw error;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return { token, nombre: user.nombre};
  }
 async listUsers(){
	return await this.userRepository.findAll();
  }
  async actualizarUsuario(id, { nombre, email, password }) {
    if (!nombre || !email) {
      const error = new Error("Faltan datos: nombre y email son obligatorios");
      error.code = "VALIDATION_ERROR";
      throw error;
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const actualizado = await this.userRepository.update(id, { nombre, email, passwordHash });
    if (!actualizado) {
      const error = new Error("Usuario no encontrado");
      error.code = "NOT_FOUND";
      throw error;
    }
  }
 async eliminarUsuario(id){
	const eliminado = await this.userRepository.deleteById(id);
	if (!eliminado) {
	const error = new Error("Usuario no encontrado");
	error.code = "NOT_FOUND";
	throw error;
	}
  }
  async actualizarPorEmail(email, { nombre, password }) {
    if (!nombre) {
      const error = new Error("Falta el nombre nuevo");
      error.code = "VALIDATION_ERROR";
      throw error;
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const actualizado = await this.userRepository.updateByEmail(email, { nombre, passwordHash });
    if (!actualizado) {
      const error = new Error("Usuario no encontrado");
      error.code = "NOT_FOUND";
      throw error;
    }
  }

 
}

module.exports = UserService;
