const UserRepositoryPort = require("../domain/userRepositoryPort");
const User = require("../domain/user");
const pool = require("./db");

class UserRepositoryAdapter extends UserRepositoryPort {
  async create(user) {
    await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3)",
      [user.nombre, user.email, user.passwordHash]
    );
  }

  async findByEmail(email) {
    const result = await pool.query(
      "SELECT * FROM usuarios WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new User({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      passwordHash: row.password_hash,
    });
  }

  async findAll() {
    const result = await pool.query(
      "SELECT id, nombre, email FROM usuarios"
    );
    return result.rows;
  }

    async update(id, { nombre, email, passwordHash }) {
    if (passwordHash) {
      const result = await pool.query(
        "UPDATE usuarios SET nombre = $1, email = $2, password_hash = $3 WHERE id = $4",
        [nombre, email, passwordHash, id]
      );
      return result.rowCount > 0;
    } else {
      const result = await pool.query(
        "UPDATE usuarios SET nombre = $1, email = $2 WHERE id = $3",
        [nombre, email, id]
      );
      return result.rowCount > 0;
    }
  }
    async updateByEmail(email, { nombre, passwordHash }) {
    if (passwordHash) {
      const result = await pool.query(
        "UPDATE usuarios SET nombre = $1, password_hash = $2 WHERE email = $3",
        [nombre, passwordHash, email]
      );
      return result.rowCount > 0;
    } else {
      const result = await pool.query(
        "UPDATE usuarios SET nombre = $1 WHERE email = $2",
        [nombre, email]
      );
      return result.rowCount > 0;
    }
  }

  async deleteById(id) {
    const result = await pool.query(
      "DELETE FROM usuarios WHERE id = $1",
      [id]
    );
    return result.rowCount > 0;
  }
}

module.exports = UserRepositoryAdapter;
