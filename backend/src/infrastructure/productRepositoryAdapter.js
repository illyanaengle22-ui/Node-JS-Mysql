const pool = require('./db');
const ProductRepositoryPort = require('../domain/productRepositoryPort');
const Product = require('../domain/product');

function mapRow(row) {
  if (!row) return null;
  return new Product({
    id: row.id,
    nombre: row.nombre,
    artista: row.artista,
    descripcion: row.descripcion,
    precio: Number(row.precio),
    imagenUrl: row.imagen_url,
    stock: row.stock,
    estado: row.estado,
    creadoPor: row.creado_por,
  });
}

// Extiende mapRow con info del creador (cuando hay JOIN)
function mapRowConCreador(row) {
  const base = mapRow(row);
  if (!base) return null;
  return {
    ...base,
    creadorNombre: row.creador_nombre || null,
    creadorEmail: row.creador_email || null,
  };
}

class ProductRepositoryAdapter extends ProductRepositoryPort {
  async create({ nombre, artista, descripcion, precio, imagenUrl, stock, creadoPor }) {
    const result = await pool.query(
      `INSERT INTO productos (nombre, artista, descripcion, precio, imagen_url, stock, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nombre, artista, descripcion || null, precio, imagenUrl || null, stock || 0, creadoPor]
    );
    return mapRow(result.rows[0]);
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
    return mapRow(result.rows[0]);
  }

  // Admin ve todos con info del creador
  async findAll() {
    const result = await pool.query(
      `SELECT p.*, u.nombre AS creador_nombre, u.email AS creador_email
       FROM productos p
       LEFT JOIN usuarios u ON u.id = p.creado_por
       ORDER BY p.id DESC`
    );
    return result.rows.map(mapRowConCreador);
  }

  // Catálogo público
  async findActivos() {
    const result = await pool.query(
      `SELECT p.*, u.nombre AS creador_nombre, u.email AS creador_email
       FROM productos p
       LEFT JOIN usuarios u ON u.id = p.creado_por
       WHERE p.estado = 'aprobado'
       ORDER BY p.id DESC`
    );
    return result.rows.map(mapRowConCreador);
  }

  // Bandeja del admin: pendientes con info del creador
  async findPendientes() {
    const result = await pool.query(
      `SELECT p.*, u.nombre AS creador_nombre, u.email AS creador_email
       FROM productos p
       LEFT JOIN usuarios u ON u.id = p.creado_por
       WHERE p.estado = 'pendiente'
       ORDER BY p.id`
    );
    return result.rows.map(mapRowConCreador);
  }

  // Productos del vendedor logueado
  async findByCreador(creadoPor) {
    const result = await pool.query(
      'SELECT * FROM productos WHERE creado_por = $1 ORDER BY id DESC',
      [creadoPor]
    );
    return result.rows.map(mapRow);
  }

  async update(id, { nombre, artista, descripcion, precio, imagenUrl, stock }) {
    const result = await pool.query(
      `UPDATE productos SET
         nombre = COALESCE($1, nombre),
         artista = COALESCE($2, artista),
         descripcion = COALESCE($3, descripcion),
         precio = COALESCE($4, precio),
         imagen_url = COALESCE($5, imagen_url),
         stock = COALESCE($6, stock)
       WHERE id = $7 RETURNING *`,
      [nombre || null, artista || null, descripcion || null, precio || null, imagenUrl || null, stock ?? null, id]
    );
    return mapRow(result.rows[0]);
  }

  async cambiarEstado(id, estado) {
    const result = await pool.query(
      `UPDATE productos SET estado = $1 WHERE id = $2 RETURNING *`,
      [estado, id]
    );
    return mapRow(result.rows[0]);
  }

  async deleteById(id) {
    const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  async findRandomAprobados(limit = 10) {
    const result = await pool.query(
      `SELECT * FROM productos
       WHERE estado = 'aprobado'
       ORDER BY RANDOM()
       LIMIT $1`,
      [limit]
    );
    return result.rows.map(mapRow);
  }
}

module.exports = ProductRepositoryAdapter;
