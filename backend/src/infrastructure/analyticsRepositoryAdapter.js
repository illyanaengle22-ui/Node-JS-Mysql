/**
 * analyticsRepositoryAdapter.js
 * Adaptador de salida: implementa AnalyticsRepositoryPort con consultas SQL
 * optimizadas en PostgreSQL. Todo el cómputo ocurre en la BD (SUM, COUNT, AVG,
 * GROUP BY, date_trunc). No se traen filas individuales a Node para agregar.
 *
 * Reglas de seguridad:
 *  - El parámetro "agrupar" (date_trunc) se valida con lista blanca en
 *    analyticsService.js y se interpola como literal solo después de eso.
 *  - Todos los demás valores de usuario van en $1, $2... (parametrizados).
 */

const pool = require('./db');
const AnalyticsRepositoryPort = require('../domain/analyticsRepositoryPort');
const { ESTADOS_VENTA } = require('../application/analyticsService');

// Construye un literal SQL de array para IN ('aprobado', ...)
// El array viene de una constante definida en código, nunca de input de usuario.
const ESTADOS_VENTA_SQL = ESTADOS_VENTA.map((e) => `'${e}'`).join(', ');

class AnalyticsRepositoryAdapter extends AnalyticsRepositoryPort {
  /**
   * Normaliza el rango a strings YYYY-MM-DD HH:mm:ss para comparaciones exactas
   * en PostgreSQL sin depender del desfase horario UTC del driver.
   * hasta es inclusivo (hasta < hastaSigDia 00:00:00).
   */
  _formatearRango(desde, hasta) {
    const toYMD = (val) => {
      if (typeof val === 'string') {
        return val.slice(0, 10);
      }
      const d = new Date(val);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const desdeYMD = toYMD(desde);
    const hastaYMD = toYMD(hasta);

    const [y, m, d] = hastaYMD.split('-').map(Number);
    const hastaSig = new Date(y, m - 1, d + 1);
    const hastaExYMD = `${hastaSig.getFullYear()}-${String(hastaSig.getMonth() + 1).padStart(2, '0')}-${String(hastaSig.getDate()).padStart(2, '0')}`;

    return {
      desdeSql: `${desdeYMD} 00:00:00`,
      hastaExSql: `${hastaExYMD} 00:00:00`,
    };
  }

  /**
   * Top productos por unidades vendidas (solo pedidos en ESTADOS_VENTA).
   * Soporta alcance por productorId (vendedor) o usuarioId (comprador).
   */
  async topProductos({ desde, hasta, limite, productorId, usuarioId }) {
    const { desdeSql, hastaExSql } = this._formatearRango(desde, hasta);
    const params = [desdeSql, hastaExSql];
    let filtroScope = '';

    if (productorId) {
      params.push(productorId);
      filtroScope = `AND pr.creado_por = $${params.length}`;
    } else if (usuarioId) {
      params.push(usuarioId);
      filtroScope = `AND p.usuario_id = $${params.length}`;
    }

    params.push(limite);
    const limiteIdx = params.length;

    const sql = `
      SELECT
        pr.id                          AS producto_id,
        pr.nombre,
        pr.artista,
        SUM(pi.cantidad)               AS unidades_vendidas,
        SUM(pi.cantidad * pi.precio_unitario) AS monto_recaudado,
        COUNT(DISTINCT p.id)           AS numero_pedidos
      FROM pedido_items pi
      JOIN pedidos    p  ON p.id  = pi.pedido_id
      JOIN productos  pr ON pr.id = pi.producto_id
      WHERE p.estado IN (${ESTADOS_VENTA_SQL})
        AND p.created_at >= $1
        AND p.created_at <  $2
        ${filtroScope}
      GROUP BY pr.id, pr.nombre, pr.artista
      ORDER BY unidades_vendidas DESC, monto_recaudado DESC
      LIMIT $${limiteIdx}
    `;
    const result = await pool.query(sql, params);
    return result.rows;
  }

  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Ingresos / gasto agrupados por período usando date_trunc.
   * Si productorId está definido: suma items de sus productos.
   * Si usuarioId está definido: suma gasto de sus pedidos.
   */
  async ingresosPorPeriodo({ desde, hasta, agrupar, productorId, usuarioId }) {
    const { desdeSql, hastaExSql } = this._formatearRango(desde, hasta);

    if (productorId) {
      const sql = `
        SELECT
          date_trunc('${agrupar}', p.created_at) AS periodo,
          SUM(pi.cantidad * pi.precio_unitario)  AS ingresos,
          COUNT(DISTINCT p.id)                   AS pedidos
        FROM pedidos p
        JOIN pedido_items pi ON pi.pedido_id = p.id
        JOIN productos pr ON pr.id = pi.producto_id
        WHERE p.estado IN (${ESTADOS_VENTA_SQL})
          AND p.created_at >= $1
          AND p.created_at <  $2
          AND pr.creado_por = $3
        GROUP BY periodo
        ORDER BY periodo ASC
      `;
      const result = await pool.query(sql, [desdeSql, hastaExSql, productorId]);
      return result.rows;
    }

    if (usuarioId) {
      const sql = `
        SELECT
          date_trunc('${agrupar}', p.created_at) AS periodo,
          SUM(p.total)                            AS ingresos,
          COUNT(p.id)                             AS pedidos
        FROM pedidos p
        WHERE p.estado IN (${ESTADOS_VENTA_SQL})
          AND p.created_at >= $1
          AND p.created_at <  $2
          AND p.usuario_id = $3
        GROUP BY periodo
        ORDER BY periodo ASC
      `;
      const result = await pool.query(sql, [desdeSql, hastaExSql, usuarioId]);
      return result.rows;
    }

    const sql = `
      SELECT
        date_trunc('${agrupar}', p.created_at) AS periodo,
        SUM(p.total)                            AS ingresos,
        COUNT(p.id)                             AS pedidos
      FROM pedidos p
      WHERE p.estado IN (${ESTADOS_VENTA_SQL})
        AND p.created_at >= $1
        AND p.created_at <  $2
      GROUP BY periodo
      ORDER BY periodo ASC
    `;
    const result = await pool.query(sql, [desdeSql, hastaExSql]);
    return result.rows;
  }

  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Conteo por estado real (todos los estados).
   * Soporta alcance por productorId o usuarioId.
   */
  async distribucionEstados({ desde, hasta, productorId, usuarioId }) {
    const { desdeSql, hastaExSql } = this._formatearRango(desde, hasta);

    if (productorId) {
      const sql = `
        SELECT
          p.estado,
          COUNT(DISTINCT p.id) AS conteo
        FROM pedidos p
        JOIN pedido_items pi ON pi.pedido_id = p.id
        JOIN productos pr ON pr.id = pi.producto_id
        WHERE p.created_at >= $1
          AND p.created_at <  $2
          AND pr.creado_por = $3
        GROUP BY p.estado
        ORDER BY conteo DESC
      `;
      const result = await pool.query(sql, [desdeSql, hastaExSql, productorId]);
      return result.rows;
    }

    if (usuarioId) {
      const sql = `
        SELECT
          p.estado,
          COUNT(p.id) AS conteo
        FROM pedidos p
        WHERE p.created_at >= $1
          AND p.created_at <  $2
          AND p.usuario_id = $3
        GROUP BY p.estado
        ORDER BY conteo DESC
      `;
      const result = await pool.query(sql, [desdeSql, hastaExSql, usuarioId]);
      return result.rows;
    }

    const sql = `
      SELECT
        p.estado,
        COUNT(p.id) AS conteo
      FROM pedidos p
      WHERE p.created_at >= $1
        AND p.created_at <  $2
      GROUP BY p.estado
      ORDER BY conteo DESC
    `;
    const result = await pool.query(sql, [desdeSql, hastaExSql]);
    return result.rows;
  }

  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Ticket promedio global y por usuario.
   */
  async ticketPromedio({ desde, hasta, usuarioId }) {
    const { desdeSql, hastaExSql } = this._formatearRango(desde, hasta);

    if (usuarioId) {
      const sql = `
        SELECT
          COALESCE(AVG(p.total), 0) AS ticket_promedio_pedido,
          COALESCE(SUM(p.total), 0) AS total_gastado,
          COUNT(p.id)               AS total_pedidos
        FROM pedidos p
        WHERE p.estado IN (${ESTADOS_VENTA_SQL})
          AND p.created_at >= $1
          AND p.created_at <  $2
          AND p.usuario_id = $3
      `;
      const result = await pool.query(sql, [desdeSql, hastaExSql, usuarioId]);
      return result.rows[0] || {};
    }

    const sql = `
      SELECT
        AVG(p.total)                        AS ticket_promedio_pedido,
        AVG(usuario_totales.total_usuario)  AS ticket_promedio_usuario,
        COUNT(p.id)                         AS total_pedidos,
        COUNT(DISTINCT p.usuario_id)        AS total_usuarios
      FROM pedidos p
      JOIN (
        SELECT usuario_id, SUM(total) AS total_usuario
        FROM pedidos
        WHERE estado IN (${ESTADOS_VENTA_SQL})
          AND created_at >= $1
          AND created_at <  $2
        GROUP BY usuario_id
      ) AS usuario_totales ON usuario_totales.usuario_id = p.usuario_id
      WHERE p.estado IN (${ESTADOS_VENTA_SQL})
        AND p.created_at >= $1
        AND p.created_at <  $2
    `;
    const result = await pool.query(sql, [desdeSql, hastaExSql]);
    return result.rows[0] || {};
  }

  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Resumen general: ingresos/gasto, pedidos, usuarios activos, etc.
   */
  async resumenGeneral({ desde, hasta, productorId, usuarioId }) {
    const { desdeSql, hastaExSql } = this._formatearRango(desde, hasta);

    if (productorId) {
      const sql = `
        SELECT
          COALESCE(SUM(pi.cantidad * pi.precio_unitario), 0) AS ingresos_total,
          COALESCE(SUM(pi.cantidad), 0)                     AS unidades_vendidas,
          COUNT(DISTINCT p.id)                              AS numero_pedidos
        FROM pedidos p
        JOIN pedido_items pi ON pi.pedido_id = p.id
        JOIN productos pr ON pr.id = pi.producto_id
        WHERE p.estado IN (${ESTADOS_VENTA_SQL})
          AND p.created_at >= $1
          AND p.created_at <  $2
          AND pr.creado_por = $3
      `;
      const result = await pool.query(sql, [desdeSql, hastaExSql, productorId]);
      return result.rows[0] || {};
    }

    if (usuarioId) {
      const sql = `
        SELECT
          COALESCE(SUM(p.total), 0) AS gasto_total,
          COUNT(p.id)               AS numero_pedidos,
          COALESCE(AVG(p.total), 0) AS ticket_promedio
        FROM pedidos p
        WHERE p.estado IN (${ESTADOS_VENTA_SQL})
          AND p.created_at >= $1
          AND p.created_at <  $2
          AND p.usuario_id = $3
      `;
      const result = await pool.query(sql, [desdeSql, hastaExSql, usuarioId]);
      return result.rows[0] || {};
    }

    const sql = `
      SELECT
        COALESCE(SUM(p.total), 0)            AS ingresos_total,
        COUNT(p.id)                          AS numero_pedidos,
        COUNT(DISTINCT p.usuario_id)         AS usuarios_activos,
        COALESCE(AVG(p.total), 0)            AS ticket_promedio
      FROM pedidos p
      WHERE p.estado IN (${ESTADOS_VENTA_SQL})
        AND p.created_at >= $1
        AND p.created_at <  $2
    `;
    const result = await pool.query(sql, [desdeSql, hastaExSql]);
    return result.rows[0] || {};
  }

  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Productos con stock bajo (stock <= umbral) de un vendedor.
   */
  async stockBajo({ productorId, umbral = 5 }) {
    const sql = `
      SELECT
        id,
        nombre,
        artista,
        precio,
        stock,
        estado,
        imagen_url AS "imagenUrl"
      FROM productos
      WHERE creado_por = $1
        AND stock <= $2
      ORDER BY stock ASC, id DESC
    `;
    const result = await pool.query(sql, [productorId, umbral]);
    return result.rows;
  }
}

module.exports = AnalyticsRepositoryAdapter;
