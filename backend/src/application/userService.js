const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ROLES_VALIDOS } = require('../domain/user');

class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async registerUser({ nombre, email, password }) {
    if (!nombre || !email) throw new Error('Nombre y email son obligatorios');
    User.validarPassword(password);

    const existente = await this.userRepository.findByEmail(email);
    if (existente) throw new Error('Ya existe un usuario con ese email');

    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = await this.userRepository.create({ nombre, email, passwordHash });
    return { id: usuario.id, nombre: usuario.nombre, email: usuario.email, estado: usuario.estado };
  }
  async crearDesdeAdmin({ nombre, email, password, rol }) {
    if (!nombre || !email || !password) throw new Error('Faltan datos: nombre, email, password');
    if (!['admin', 'producto', 'pedido'].includes(rol)) throw new Error('Rol inválido');

    User.validarPassword(password);

    const existente = await this.userRepository.findByEmail(email);
    if (existente) throw new Error('Ya existe un usuario con ese email');

    const passwordHash = await bcrypt.hash(password, 10);

    // Crear y activar de una sola vez (si tu repo lo soporta con rol + estado)
    const usuario = await this.userRepository.create({
      nombre,
      email,
      passwordHash,
      rol,
      estado: 'activo',
    });

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      estado: usuario.estado,
    };
  }
  async cambiarRol(id, { rol, estado }) {
    if (rol && !['admin', 'producto', 'pedido'].includes(rol)) {
      throw new Error('Rol inválido');
    }
    const actualizado = await this.userRepository.updateRolYEstado(id, { rol, estado });
    if (!actualizado) throw new Error('Usuario no encontrado');
    return actualizado;
  }

  async loginUser({ email, password }) {
    const usuario = await this.userRepository.findByEmail(email);
    if (!usuario) throw new Error('Credenciales inválidas');

    const passwordOk = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordOk) throw new Error('Credenciales inválidas');

    if (usuario.estado !== 'activo' || !usuario.rol) {
      const err = new Error('Tu cuenta está pendiente de aprobación por un administrador');
      err.codigo = 'PENDIENTE_APROBACION';
      throw err;
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET || 'secreto_dev',
      { expiresIn: '8h' }
    );

    return { token, nombre: usuario.nombre, rol: usuario.rol };
  }

  async listUsers() {
    return this.userRepository.findAll();
  }

  async listPendientes() {
    return this.userRepository.findPendientes();
  }

  async aprobarUsuario(id, rol) {
    User.validarRol(rol);
    const usuario = await this.userRepository.asignarRol(id, rol, 'activo');
    if (!usuario) throw new Error('Usuario no encontrado');
    return usuario;
  }

  async negarUsuario(id) {
    const eliminado = await this.userRepository.deleteById(id);
    if (!eliminado) throw new Error('Usuario no encontrado');
    return true;
  }

  async actualizarUsuario(id, { nombre, password }) {
    let passwordHash;
    if (password) {
      User.validarPassword(password);
      passwordHash = await bcrypt.hash(password, 10);
    }
    const actual = await this.userRepository.findById(id);
    if (!actual) throw new Error('Usuario no encontrado');
    return this.userRepository.update(id, { nombre, passwordHash });
  }

  async actualizarPorEmail(email, { nombre, password }) {
    let passwordHash;
    if (password) {
      User.validarPassword(password);
      passwordHash = await bcrypt.hash(password, 10);
    }
    const actual = await this.userRepository.findByEmail(email);
    if (!actual) throw new Error('Usuario no encontrado');
    return this.userRepository.updateByEmail(email, { nombre, passwordHash });
  }

  async eliminarUsuario(id) {
    const eliminado = await this.userRepository.deleteById(id);
    if (!eliminado) throw new Error('Usuario no encontrado');
    return true;
  }
}

module.exports = UserService;
