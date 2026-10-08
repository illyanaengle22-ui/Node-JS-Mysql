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

  /**
   * Reserva stock de forma atómica e inserta el pedido con estado 'pendiente'.
   * Ejecutado dentro de una transacción PostgreSQL.
   */
  async crearYReservar({ usuarioId, productoId, cantidad }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Intentar descontar stock atómicamente solo si el producto existe, está aprobado y tiene suficiente stock
      const resStock = await client.query(
        `UPDATE productos
            SET stock = stock - $1
          WHERE id = $2 AND stock >= $1 AND estado = 'aprobado'
         RETURNING id, precio, stock`,
        [cantidad, productoId]
      );

      if (resStock.rowCount === 0) {
        // Consultar el motivo específico del fallo
        const resProd = await client.query('SELECT * FROM productos WHERE id = $1', [productoId]);
        if (resProd.rowCount === 0) {
          const err = new Error('Producto no encontrado');
          err.statusCode = 404;
          throw err;
        }
        const prod = resProd.rows[0];
        if (prod.estado !== 'aprobado') {
          const err = new Error('Este producto todavía no está disponible en el catálogo');
          err.statusCode = 400;
          throw err;
        }
        // Si el estado es aprobado pero rowCount fue 0, entonces no hay suficiente stock
        const err = new Error(`Stock insuficiente para realizar el pedido. Stock disponible: ${prod.stock}, solicitado: ${cantidad}`);
        err.statusCode = 400;
        throw err;
      }

      const producto = resStock.rows[0];
      const total = Order.calcularTotal(producto.precio, cantidad);

      const resPedido = await client.query(
        `INSERT INTO pedidos (usuario_id, producto_id, cantidad, total, estado)
         VALUES ($1, $2, $3, $4, 'pendiente') RETURNING *`,
        [usuarioId, productoId, cantidad, total]
      );

      await client.query('COMMIT');
      return mapRow(resPedido.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Cambia el estado del pedido a 'aprobado'. NO toca el stock (ya fue reservado).
   */
  async aprobar(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const resCheck = await client.query('SELECT * FROM pedidos WHERE id = $1 FOR UPDATE', [id]);
      if (resCheck.rowCount === 0) {
        const err = new Error('Pedido no encontrado');
        err.statusCode = 404;
        throw err;
      }

      const pedidoActual = resCheck.rows[0];
      Order.puedeCambiarEstado(pedidoActual.estado);

      const resUpdate = await client.query(
        `UPDATE pedidos SET estado = 'aprobado' WHERE id = $1 AND estado = 'pendiente' RETURNING *`,
        [id]
      );

      await client.query('COMMIT');
      return mapRow(resUpdate.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Cambia el estado a 'rechazado' y libera (devuelve) el stock al producto.
   */
  async rechazarYLiberar(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const resCheck = await client.query('SELECT * FROM pedidos WHERE id = $1 FOR UPDATE', [id]);
      if (resCheck.rowCount === 0) {
        const err = new Error('Pedido no encontrado');
        err.statusCode = 404;
        throw err;
      }

      const pedidoActual = resCheck.rows[0];
      Order.puedeCambiarEstado(pedidoActual.estado);

      await client.query(
        `UPDATE pedidos SET estado = 'rechazado' WHERE id = $1 AND estado = 'pendiente'`,
        [id]
      );

      // Devolver stock reservado
      await client.query(
        `UPDATE productos SET stock = stock + $1 WHERE id = $2`,
        [pedidoActual.cantidad, pedidoActual.producto_id]
      );

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Elimina un pedido. Si estaba 'pendiente', libera el stock reservado.
   * Si ya estaba 'aprobado' o 'rechazado', elimina sin devolver stock adicional.
   */
  async eliminarYLiberar(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const resCheck = await client.query('SELECT * FROM pedidos WHERE id = $1 FOR UPDATE', [id]);
      if (resCheck.rowCount === 0) {
        const err = new Error('Pedido no encontrado');
        err.statusCode = 404;
        throw err;
      }

      const pedidoActual = resCheck.rows[0];

      // Liberar stock solo si el pedido estaba en estado 'pendiente'
      if (pedidoActual.estado === 'pendiente') {
        await client.query(
          `UPDATE productos SET stock = stock + $1 WHERE id = $2`,
          [pedidoActual.cantidad, pedidoActual.producto_id]
        );
      }

      await client.query('DELETE FROM pedidos WHERE id = $1', [id]);

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

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
}

module.exports = OrderRepositoryAdapter;
