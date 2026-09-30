const pool = require('./db');
const UserRepositoryPort = require('../domain/userRepositoryPort');
const { User } = require('../domain/user');

function mapRow(row) {
  if (!row) return null;
  return new User({
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    passwordHash: row.password_hash,
    rol: row.rol,
    estado: row.estado,
  });
}

class UserRepositoryAdapter extends UserRepositoryPort {
  async create({ nombre, email, passwordHash, rol = null, estado = 'pendiente' }) {
    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, estado)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, email, passwordHash, rol, estado]
    );
    return mapRow(result.rows[0]);
  }
  async findByEmail(email) {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return mapRow(result.rows[0]);
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    return mapRow(result.rows[0]);
  }

  async findAll() {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, estado, created_at FROM usuarios ORDER BY id'
    );
    return result.rows;
  }

  async findPendientes() {
    const result = await pool.query(
      `SELECT id, nombre, email, rol, estado, created_at FROM usuarios
       WHERE estado = 'pendiente' ORDER BY created_at`
    );
    return result.rows;
  }

  async update(id, { nombre, passwordHash }) {
    const result = await pool.query(
      `UPDATE usuarios SET
         nombre = COALESCE($1, nombre),
         password_hash = COALESCE($2, password_hash)
       WHERE id = $3 RETURNING *`,
      [nombre || null, passwordHash || null, id]
    );
    return mapRow(result.rows[0]);
  }
  async updateRolYEstado(id, { rol, estado }) {
    const result = await pool.query(
      `UPDATE usuarios SET
         rol = COALESCE($1, rol),
         estado = COALESCE($2, estado)
       WHERE id = $3 RETURNING *`,
      [rol || null, estado || null, id]
    );
    return mapRow(result.rows[0]);
  }

  async updateByEmail(email, { nombre, passwordHash }) {
    const result = await pool.query(
      `UPDATE usuarios SET
         nombre = COALESCE($1, nombre),
         password_hash = COALESCE($2, password_hash)
       WHERE email = $3 RETURNING *`,
      [nombre || null, passwordHash || null, email]
    );
    return mapRow(result.rows[0]);
  }

  // Aquí es donde el admin da acceso: le pone rol y pasa estado a 'activo'
  async asignarRol(id, rol, estado = 'activo') {
    const result = await pool.query(
      `UPDATE usuarios SET rol = $1, estado = $2 WHERE id = $3 RETURNING *`,
      [rol, estado, id]
    );
    return mapRow(result.rows[0]);
  }

  async deleteById(id) {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }
}

module.exports = UserRepositoryAdapter;
