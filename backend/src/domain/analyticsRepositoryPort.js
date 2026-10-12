/**
 * analyticsRepositoryPort.js
 * Puerto de consultas analíticas (contrato).
 * Sin SQL, sin pg, sin dependencias externas — solo la firma de los métodos.
 */
class AnalyticsRepositoryPort {
  /**
   * Top productos por unidades vendidas y monto recaudado.
   * @param {Object} params
   * @param {Date}   params.desde        - Fecha inicio (inclusiva)
   * @param {Date}   params.hasta        - Fecha fin (inclusiva)
   * @param {number} params.limite       - 5 o 10
   * @param {number} [params.productorId] - Filtra por creador del producto
   * @param {number} [params.usuarioId]   - Filtra por comprador del pedido
   * @returns {Promise<Array>}
   */
  async topProductos({ desde, hasta, limite, productorId, usuarioId }) {
    throw new Error('No implementado');
  }

  /**
   * Ingresos agrupados por período (serie temporal).
   * @param {Object} params
   * @param {Date}   params.desde
   * @param {Date}   params.hasta
   * @param {string} params.agrupar     - 'day' | 'week' | 'month'
   * @param {number} [params.productorId]
   * @param {number} [params.usuarioId]
   * @returns {Promise<Array>}
   */
  async ingresosPorPeriodo({ desde, hasta, agrupar, productorId, usuarioId }) {
    throw new Error('No implementado');
  }

  /**
   * Conteo y distribución porcentual de pedidos por estado.
   * @param {Object} params
   * @param {Date}   params.desde
   * @param {Date}   params.hasta
   * @param {number} [params.productorId]
   * @param {number} [params.usuarioId]
   * @returns {Promise<Array>}
   */
  async distribucionEstados({ desde, hasta, productorId, usuarioId }) {
    throw new Error('No implementado');
  }

  /**
   * Ticket promedio global y por usuario.
   * @param {Object} params
   * @param {Date}   params.desde
   * @param {Date}   params.hasta
   * @param {number} [params.usuarioId]
   * @returns {Promise<Object>}
   */
  async ticketPromedio({ desde, hasta, usuarioId }) {
    throw new Error('No implementado');
  }

  /**
   * Resumen general: ingresos/gasto, número de pedidos, etc.
   * @param {Object} params
   * @param {Date}   params.desde
   * @param {Date}   params.hasta
   * @param {number} [params.productorId]
   * @param {number} [params.usuarioId]
   * @returns {Promise<Object>}
   */
  async resumenGeneral({ desde, hasta, productorId, usuarioId }) {
    throw new Error('No implementado');
  }

  /**
   * Productos con stock bajo (stock <= umbral) de un vendedor.
   * @param {Object} params
   * @param {number} params.productorId
   * @param {number} [params.umbral] - Por defecto 5
   * @returns {Promise<Array>}
   */
  async stockBajo({ productorId, umbral = 5 }) {
    throw new Error('No implementado');
  }
}

module.exports = AnalyticsRepositoryPort;
