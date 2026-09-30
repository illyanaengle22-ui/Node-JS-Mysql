const pool = require('./db');
const OrderRepositoryPort = require('../domain/orderRepositoryPort');
const Order = require('../domain/order');

function mapRow(row) {
  if (!row) return null;
  return new Order({
    id: row.id,
    usuarioId: row.usuario_id,
    productoId: row.producto_id,
    cantidad: row.cantidad,
    total: row.total !== null ? Number(row.total) : null,
    estado: row.estado,
    createdAt: row.created_at,
  });
}

class OrderRepositoryAdapter extends OrderRepositoryPort {
  async create({ usuarioId, productoId, cantidad, total }) {
    const result = await pool.query(
      `INSERT INTO pedidos (usuario_id, producto_id, cantidad, total)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [usuarioId, productoId, cantidad, total]
    );
    return mapRow(result.rows[0]);
  }

  // datos productos
  async findAll() {
    const result = await pool.query(
      `SELECT 
         p.*,
         pr.nombre AS producto_nombre,
         pr.artista,
         pr.precio AS precio_unitario,
         pr.imagen_url,
         u.nombre AS usuario_nombre,
         u.email AS usuario_email
       FROM pedidos p
       JOIN productos pr ON pr.id = p.producto_id
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       ORDER BY p.id DESC`
    );
    return result.rows;
  }

  async findByUsuario(usuarioId) {
    const result = await pool.query(
      `SELECT 
         p.*,
         pr.nombre AS producto_nombre,
         pr.artista,
         pr.precio AS precio_unitario,
         pr.imagen_url
       FROM pedidos p
       JOIN productos pr ON pr.id = p.producto_id
       WHERE p.usuario_id = $1
       ORDER BY p.id DESC`,
      [usuarioId]
    );
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    return mapRow(result.rows[0]);
  }
  async updateEstado(id, estado) {
    const result = await pool.query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING id',
      [estado, id]
    );
    return result.rowCount > 0;
  }
  
  async findByCreadorProducto(vendedorId) {
    const result = await pool.query(
      `SELECT 
         p.id,
         p.cantidad,
         p.total,
         p.estado,
         p.created_at,
         pr.id AS producto_id,
         pr.nombre AS producto_nombre,
         pr.artista,
         pr.precio AS precio_unitario,
         pr.imagen_url,
         u.nombre AS cliente_nombre,
         u.email AS cliente_email
       FROM pedidos p
       JOIN productos pr ON pr.id = p.producto_id
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       WHERE pr.creado_por = $1
       ORDER BY p.id DESC`,
      [vendedorId]
    );
    return result.rows;
  }

  async deleteById(id) {
    const result = await pool.query('DELETE FROM pedidos WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }
}

module.exports = OrderRepositoryAdapter;
