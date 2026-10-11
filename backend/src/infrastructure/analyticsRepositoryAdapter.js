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
   * Ajusta "hasta" para que el filtro sea inclusivo (hasta < hasta + 1 día).
   * @param {Date} hasta
   * @returns {Date}
   */
  _hastaExclusivo(hasta) {
    const d = new Date(hasta);
    d.setDate(d.getDate() + 1);
    return d;
  }

  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Top N productos por unidades vendidas (solo pedidos en ESTADOS_VENTA).
   * Usa la tabla pedido_items para desglosar el conteo por producto.
   */
  async topProductos({ desde, hasta, limite }) {
    const hastaEx = this._hastaExclusivo(hasta);
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
      GROUP BY pr.id, pr.nombre, pr.artista
      ORDER BY unidades_vendidas DESC, monto_recaudado DESC
      LIMIT $3
    `;
    const result = await pool.query(sql, [desde, hastaEx, limite]);
    return result.rows;
  }

  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Ingresos agrupados por período usando date_trunc.
   * El parámetro "agrupar" ya fue validado con lista blanca (day/week/month)
   * por analyticsService.js, por lo que es seguro interpolarlo como literal SQL.
   */
  async ingresosPorPeriodo({ desde, hasta, agrupar }) {
    const hastaEx = this._hastaExclusivo(hasta);
    // agrupar = 'day' | 'week' | 'month' — solo estos tres valores posibles
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
    const result = await pool.query(sql, [desde, hastaEx]);
    return result.rows;
  }

  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Conteo por estado real (todos los estados, sin filtro de ESTADOS_VENTA).
   * El servicio calculará los porcentajes y el mapeo a categorías analíticas.
   */
  async distribucionEstados({ desde, hasta }) {
    const hastaEx = this._hastaExclusivo(hasta);
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
    const result = await pool.query(sql, [desde, hastaEx]);
    return result.rows;
  }

  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Ticket promedio global y agrupado por usuario (solo ESTADOS_VENTA).
   */
  async ticketPromedio({ desde, hasta }) {
    const hastaEx = this._hastaExclusivo(hasta);
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
    const result = await pool.query(sql, [desde, hastaEx]);
    return result.rows[0] || {};
  }

  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Resumen general: ingresos, pedidos, usuarios activos, ticket promedio.
   * Solo pedidos en ESTADOS_VENTA para las métricas financieras.
   * Usuarios activos = usuarios con al menos un pedido aprobado en el período.
   */
  async resumenGeneral({ desde, hasta }) {
    const hastaEx = this._hastaExclusivo(hasta);
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
    const result = await pool.query(sql, [desde, hastaEx]);
    return result.rows[0] || {};
  }
}

module.exports = AnalyticsRepositoryAdapter;
