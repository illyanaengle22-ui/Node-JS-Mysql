const pool = require('./db');
const OrderRepositoryPort = require('../domain/orderRepositoryPort');
const Order = require('../domain/order');

function mapRow(row) {
  if (!row) return null;
  return new Order({
    id: row.id,
    usuarioId: row.usuario_id,
    items: row.items || [],
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
  async crearYReservar({ usuarioId, items }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      let totalPedido = 0;
      const procesados = [];

      // Reservar stock para cada item
      for (const item of items) {
        const resStock = await client.query(
          `UPDATE productos
              SET stock = stock - $1
            WHERE id = $2 AND stock >= $1 AND estado = 'aprobado'
           RETURNING id, precio, stock, nombre`,
          [item.cantidad, item.productoId]
        );

        if (resStock.rowCount === 0) {
          const resProd = await client.query('SELECT * FROM productos WHERE id = $1', [item.productoId]);
          if (resProd.rowCount === 0) {
            const err = new Error(`Producto no encontrado (ID: ${item.productoId})`);
            err.statusCode = 404;
            throw err;
          }
          const prod = resProd.rows[0];
          if (prod.estado !== 'aprobado') {
            const err = new Error(`El producto "${prod.nombre}" todavía no está disponible en el catálogo`);
            err.statusCode = 400;
            throw err;
          }
          const err = new Error(`Stock insuficiente para "${prod.nombre}". Stock disponible: ${prod.stock}, solicitado: ${item.cantidad}`);
          err.statusCode = 400;
          throw err;
        }

        const producto = resStock.rows[0];
        const subtotal = Order.calcularTotal(producto.precio, item.cantidad);
        totalPedido += subtotal;

        procesados.push({
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: producto.precio
        });
      }

      const resPedido = await client.query(
        `INSERT INTO pedidos (usuario_id, total, estado)
         VALUES ($1, $2, 'pendiente') RETURNING *`,
        [usuarioId, totalPedido]
      );

      const pedido = resPedido.rows[0];

      for (const proc of procesados) {
        await client.query(
          `INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
           VALUES ($1, $2, $3, $4)`,
          [pedido.id, proc.productoId, proc.cantidad, proc.precioUnitario]
        );
      }

      await client.query('COMMIT');
      return this.findById(pedido.id);
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
      return this.findById(id);
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
      const itemsRes = await client.query('SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = $1', [id]);
      for (const item of itemsRes.rows) {
        await client.query(
          `UPDATE productos SET stock = stock + $1 WHERE id = $2`,
          [item.cantidad, item.producto_id]
        );
      }

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
        const itemsRes = await client.query('SELECT producto_id, cantidad FROM pedido_items WHERE pedido_id = $1', [id]);
        for (const item of itemsRes.rows) {
          await client.query(
            `UPDATE productos SET stock = stock + $1 WHERE id = $2`,
            [item.cantidad, item.producto_id]
          );
        }
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
         u.nombre AS usuario_nombre,
         u.email AS usuario_email,
         COALESCE(
           json_agg(
             json_build_object(
               'producto_id', pr.id,
               'nombre', pr.nombre,
               'artista', pr.artista,
               'precio_unitario', pi.precio_unitario,
               'cantidad', pi.cantidad,
               'imagen_url', pr.imagen_url
             )
           ) FILTER (WHERE pi.id IS NOT NULL), 
           '[]'
         ) AS items
       FROM pedidos p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
       LEFT JOIN productos pr ON pr.id = pi.producto_id
       GROUP BY p.id, u.id
       ORDER BY p.id DESC`
    );
    return result.rows;
  }

  async findByUsuario(usuarioId) {
    const result = await pool.query(
      `SELECT 
         p.*,
         COALESCE(
           json_agg(
             json_build_object(
               'producto_id', pr.id,
               'nombre', pr.nombre,
               'artista', pr.artista,
               'precio_unitario', pi.precio_unitario,
               'cantidad', pi.cantidad,
               'imagen_url', pr.imagen_url
             )
           ) FILTER (WHERE pi.id IS NOT NULL), 
           '[]'
         ) AS items
       FROM pedidos p
       LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
       LEFT JOIN productos pr ON pr.id = pi.producto_id
       WHERE p.usuario_id = $1
       GROUP BY p.id
       ORDER BY p.id DESC`,
      [usuarioId]
    );
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query(
      `SELECT 
         p.*,
         COALESCE(
           json_agg(
             json_build_object(
               'producto_id', pr.id,
               'nombre', pr.nombre,
               'artista', pr.artista,
               'precio_unitario', pi.precio_unitario,
               'cantidad', pi.cantidad,
               'imagen_url', pr.imagen_url
             )
           ) FILTER (WHERE pi.id IS NOT NULL), 
           '[]'
         ) AS items
       FROM pedidos p
       LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
       LEFT JOIN productos pr ON pr.id = pi.producto_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id]
    );
    return result.rows[0];
  }

  async findByCreadorProducto(vendedorId) {
    const result = await pool.query(
      `SELECT 
         p.*,
         u.nombre AS cliente_nombre,
         u.email AS cliente_email,
         COALESCE(
           json_agg(
             json_build_object(
               'producto_id', pr.id,
               'nombre', pr.nombre,
               'artista', pr.artista,
               'precio_unitario', pi.precio_unitario,
               'cantidad', pi.cantidad,
               'imagen_url', pr.imagen_url
             )
           ) FILTER (WHERE pi.id IS NOT NULL), 
           '[]'
         ) AS items
       FROM pedidos p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       JOIN pedido_items pi ON pi.pedido_id = p.id
       JOIN productos pr ON pr.id = pi.producto_id AND pr.creado_por = $1
       GROUP BY p.id, u.id
       ORDER BY p.id DESC`,
      [vendedorId]
    );
    return result.rows;
  }
}

module.exports = OrderRepositoryAdapter;
