const ROLES_VALIDOS = ['admin', 'producto', 'pedido'];
const ESTADOS_VALIDOS = ['pendiente', 'activo'];

class User {
  constructor({ id, nombre, email, passwordHash, rol = null, estado = 'pendiente' }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.passwordHash = passwordHash;
    this.rol = rol;
    this.estado = estado;
  }

  //Regla de negocio: política mínima de contraseña segura
  static validarPassword(password) {
    if (!password || password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('La contraseña debe incluir al menos una letra mayúscula');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('La contraseña debe incluir al menos un número');
    }
    return true;
  }

  static validarRol(rol) {
    if (!ROLES_VALIDOS.includes(rol)) {
      throw new Error(`Rol inválido. Debe ser uno de: ${ROLES_VALIDOS.join(', ')}`);
    }
    return true;
  }

  estaActivo() {
    return this.estado === 'activo' && ROLES_VALIDOS.includes(this.rol);
  }
}

module.exports = { User, ROLES_VALIDOS, ESTADOS_VALIDOS };
