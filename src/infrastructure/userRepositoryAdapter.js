const UserRepositoryPort = require("../domain/userRepositoryPort");
const User = require("../domain/user");
const pool = require("./db");

class UserRepositoryAdapter extends UserRepositoryPort {
  async create(user) {
    await pool.query(
      "INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)",
      [user.nombre, user.email, user.passwordHash]
    );
  }

  async findByEmail(email) {
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    if (rows.length === 0) return null;

    const row = rows[0];
    return new User({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      passwordHash: row.password_hash,
    });
  }
 async findAll(){
   const[rows] = await pool.query(
      "SELECT id,nombre,email,password_hash FROM usuarios");
	return rows;
  }
  async update(id, { nombre, email, passwordHash }) {
    if (passwordHash) {
      await pool.query(
        "UPDATE usuarios SET nombre = ?, email = ?, password_hash = ? WHERE id = ?",
        [nombre, email, passwordHash, id]
      );
    } else {
      await pool.query(
        "UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?",
        [nombre, email, id]
      );
    }
  }
 async deleteById(id){
	const[result] = await pool.query(
	"DELETE FROM usuarios WHERE id = ?",[id]);
	return result.affectedRows > 0;
 }
}

module.exports = UserRepositoryAdapter;
