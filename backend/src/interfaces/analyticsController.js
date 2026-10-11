/**
 * analyticsController.js
 * Adaptador de entrada REST para el subsistema analítico.
 * Estilo de manejo de errores idéntico a orderController.js:
 *   - _handleError usa err.statusCode || err.status || 400
 *   - Responde siempre con { error: mensaje }
 */

class AnalyticsController {
  /**
   * @param {import('../application/analyticsService').AnalyticsService} analyticsService
   */
  constructor(analyticsService) {
    this.service = analyticsService;
  }

  _handleError = (res, err) => {
    const status = err.statusCode || err.status || 400;
    res.status(status).json({ error: err.message });
  };

  // ── GET /reportes/top-productos?desde&hasta&limite ─────────────────────────
  topProductos = async (req, res) => {
    try {
      const { desde, hasta, limite = '5' } = req.query;
      if (!desde || !hasta) {
        return res.status(400).json({ error: 'Se requieren los parámetros "desde" y "hasta"' });
      }
      const datos = await this.service.obtenerTopProductos({ desde, hasta, limite });
      res.json(datos);
    } catch (err) {
      this._handleError(res, err);
    }
  };

  // ── GET /reportes/ingresos?desde&hasta&agrupar ────────────────────────────
  ingresos = async (req, res) => {
    try {
      const { desde, hasta, agrupar = 'mes' } = req.query;
      if (!desde || !hasta) {
        return res.status(400).json({ error: 'Se requieren los parámetros "desde" y "hasta"' });
      }
      const datos = await this.service.obtenerIngresosPorPeriodo({ desde, hasta, agrupar });
      res.json(datos);
    } catch (err) {
      this._handleError(res, err);
    }
  };

  // ── GET /reportes/estados?desde&hasta ─────────────────────────────────────
  estados = async (req, res) => {
    try {
      const { desde, hasta } = req.query;
      if (!desde || !hasta) {
        return res.status(400).json({ error: 'Se requieren los parámetros "desde" y "hasta"' });
      }
      const datos = await this.service.obtenerDistribucionEstados({ desde, hasta });
      res.json(datos);
    } catch (err) {
      this._handleError(res, err);
    }
  };

  // ── GET /reportes/ticket-promedio?desde&hasta ─────────────────────────────
  ticketPromedio = async (req, res) => {
    try {
      const { desde, hasta } = req.query;
      if (!desde || !hasta) {
        return res.status(400).json({ error: 'Se requieren los parámetros "desde" y "hasta"' });
      }
      const datos = await this.service.obtenerTicketPromedio({ desde, hasta });
      res.json(datos);
    } catch (err) {
      this._handleError(res, err);
    }
  };

  // ── GET /reportes/resumen?desde&hasta ─────────────────────────────────────
  resumen = async (req, res) => {
    try {
      const { desde, hasta } = req.query;
      if (!desde || !hasta) {
        return res.status(400).json({ error: 'Se requieren los parámetros "desde" y "hasta"' });
      }
      const datos = await this.service.obtenerResumen({ desde, hasta });
      res.json(datos);
    } catch (err) {
      this._handleError(res, err);
    }
  };
}

module.exports = AnalyticsController;
