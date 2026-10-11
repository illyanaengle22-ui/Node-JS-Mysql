/**
 * analyticsRepositoryPort.js
 * Puerto de consultas analíticas (contrato).
 * Sin SQL, sin pg, sin dependencias externas — solo la firma de los métodos.
 */
class AnalyticsRepositoryPort {
  /**
   * Top productos por unidades vendidas y monto recaudado.
   * @param {Object} params
   * @param {Date}   params.desde  - Fecha inicio (inclusiva)
   * @param {Date}   params.hasta  - Fecha fin (inclusiva)
   * @param {number} params.limite - 5 o 10
   * @returns {Promise<Array>}
   */
  async topProductos({ desde, hasta, limite }) {
    throw new Error('No implementado');
  }

  /**
   * Ingresos agrupados por período (serie temporal).
   * @param {Object} params
   * @param {Date}   params.desde
   * @param {Date}   params.hasta
   * @param {string} params.agrupar - 'day' | 'week' | 'month'
   * @returns {Promise<Array>}
   */
  async ingresosPorPeriodo({ desde, hasta, agrupar }) {
    throw new Error('No implementado');
  }

  /**
   * Conteo y distribución porcentual de pedidos por estado.
   * @param {Object} params
   * @param {Date}   params.desde
   * @param {Date}   params.hasta
   * @returns {Promise<Array>}
   */
  async distribucionEstados({ desde, hasta }) {
    throw new Error('No implementado');
  }

  /**
   * Ticket promedio global y por usuario.
   * @param {Object} params
   * @param {Date}   params.desde
   * @param {Date}   params.hasta
   * @returns {Promise<Object>}
   */
  async ticketPromedio({ desde, hasta }) {
    throw new Error('No implementado');
  }

  /**
   * Resumen general: ingresos totales, número de pedidos, usuarios activos.
   * @param {Object} params
   * @param {Date}   params.desde
   * @param {Date}   params.hasta
   * @returns {Promise<Object>}
   */
  async resumenGeneral({ desde, hasta }) {
    throw new Error('No implementado');
  }
}

module.exports = AnalyticsRepositoryPort;
