/**
 * analyticsService.js
 * Caso de uso del subsistema analítico.
 * Responsabilidades: validar rangos de fechas, traducir parámetros con lista blanca,
 * calcular porcentajes. SIN SQL — delega toda la persistencia al puerto.
 */

// ─── Constantes del dominio analítico ────────────────────────────────────────

/** Estados que representan una venta real confirmada */
const ESTADOS_VENTA = ['aprobado'];

/**
 * Mapeo de estados reales del sistema a categorías analíticas legibles.
 * Estados reales: pendiente_pago | verificando_pago | aprobado | rechazado
 */
const MAPA_ESTADOS = {
  pendiente_pago:    'Pendiente',
  verificando_pago:  'Pendiente',
  aprobado:          'Pagado',
  rechazado:         'Cancelado',
};

/** Lista blanca para el parámetro "agrupar" → valor seguro para date_trunc */
const AGRUPACIONES_VALIDAS = {
  dia:    'day',
  semana: 'week',
  mes:    'month',
};

/** Límites permitidos para top productos */
const LIMITES_VALIDOS = [5, 10];

// ─── Clase ───────────────────────────────────────────────────────────────────

class AnalyticsService {
  /**
   * @param {import('../domain/analyticsRepositoryPort')} analyticsRepository
   */
  constructor(analyticsRepository) {
    this.repo = analyticsRepository;
  }

  // ── Helpers de validación ──────────────────────────────────────────────────

  /**
   * Parsea y valida un rango de fechas.
   * @param {string} desdeStr
   * @param {string} hastaStr
   * @returns {{ desde: Date, hasta: Date }}
   * @throws {Error} con statusCode 400 si las fechas son inválidas o invertidas
   */
  _validarRango(desdeStr, hastaStr) {
    const desde = new Date(desdeStr);
    const hasta = new Date(hastaStr);

    if (isNaN(desde.getTime())) {
      const err = new Error('La fecha "desde" no es válida');
      err.statusCode = 400;
      throw err;
    }
    if (isNaN(hasta.getTime())) {
      const err = new Error('La fecha "hasta" no es válida');
      err.statusCode = 400;
      throw err;
    }
    if (desde > hasta) {
      const err = new Error('"desde" no puede ser posterior a "hasta"');
      err.statusCode = 400;
      throw err;
    }

    return { desde, hasta };
  }

  /**
   * Traduce el parámetro "agrupar" a un valor seguro para date_trunc.
   * Solo acepta valores de la lista blanca para evitar inyección.
   */
  _traducirAgrupacion(agrupar = 'mes') {
    const valor = AGRUPACIONES_VALIDAS[agrupar];
    if (!valor) {
      const err = new Error(`Agrupación inválida. Valores permitidos: ${Object.keys(AGRUPACIONES_VALIDAS).join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
    return valor;
  }

  /**
   * Valida el límite del top y devuelve el número entero.
   */
  _validarLimite(limiteStr) {
    const n = parseInt(limiteStr, 10);
    if (!LIMITES_VALIDOS.includes(n)) {
      const err = new Error(`Límite inválido. Valores permitidos: ${LIMITES_VALIDOS.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
    return n;
  }

  // ── Casos de uso ───────────────────────────────────────────────────────────

  /**
   * Top N productos por unidades vendidas y monto recaudado.
   */
  async obtenerTopProductos({ desde: desdeStr, hasta: hastaStr, limite: limiteStr = '5' }) {
    const { desde, hasta } = this._validarRango(desdeStr, hastaStr);
    const limite = this._validarLimite(limiteStr);
    const filas = await this.repo.topProductos({ desde, hasta, limite });
    return filas.map((f) => ({
      productoId:        Number(f.producto_id),
      nombre:            f.nombre,
      artista:           f.artista,
      unidadesVendidas:  Number(f.unidades_vendidas),
      montoRecaudado:    Number(f.monto_recaudado),
      numeroPedidos:     Number(f.numero_pedidos),
    }));
  }

  /**
   * Ingresos por período (serie temporal para gráfica de barras/líneas).
   */
  async obtenerIngresosPorPeriodo({ desde: desdeStr, hasta: hastaStr, agrupar = 'mes' }) {
    const { desde, hasta } = this._validarRango(desdeStr, hastaStr);
    const agrupacion = this._traducirAgrupacion(agrupar);
    const filas = await this.repo.ingresosPorPeriodo({ desde, hasta, agrupar: agrupacion });
    return filas.map((f) => ({
      periodo:    f.periodo,  // ISO string del truncado
      ingresos:   Number(f.ingresos),
      pedidos:    Number(f.pedidos),
    }));
  }

  /**
   * Distribución de pedidos por estado con porcentajes calculados en el servicio.
   */
  async obtenerDistribucionEstados({ desde: desdeStr, hasta: hastaStr }) {
    const { desde, hasta } = this._validarRango(desdeStr, hastaStr);
    const filas = await this.repo.distribucionEstados({ desde, hasta });

    const total = filas.reduce((acc, f) => acc + Number(f.conteo), 0);

    return filas.map((f) => ({
      estadoReal:        f.estado,
      categoriaAnalitica: MAPA_ESTADOS[f.estado] || f.estado,
      conteo:            Number(f.conteo),
      porcentaje:        total > 0 ? parseFloat(((Number(f.conteo) / total) * 100).toFixed(2)) : 0,
    }));
  }

  /**
   * Ticket promedio de pedidos y por usuario (solo ventas reales).
   */
  async obtenerTicketPromedio({ desde: desdeStr, hasta: hastaStr }) {
    const { desde, hasta } = this._validarRango(desdeStr, hastaStr);
    const datos = await this.repo.ticketPromedio({ desde, hasta });
    return {
      ticketPromedioPedido:  Number(datos.ticket_promedio_pedido)  || 0,
      ticketPromedioUsuario: Number(datos.ticket_promedio_usuario) || 0,
      totalPedidos:          Number(datos.total_pedidos)           || 0,
      totalUsuarios:         Number(datos.total_usuarios)          || 0,
    };
  }

  /**
   * Resumen rápido para las tarjetas del dashboard.
   */
  async obtenerResumen({ desde: desdeStr, hasta: hastaStr }) {
    const { desde, hasta } = this._validarRango(desdeStr, hastaStr);
    const datos = await this.repo.resumenGeneral({ desde, hasta });
    return {
      ingresosTotal:    Number(datos.ingresos_total)    || 0,
      numeroPedidos:    Number(datos.numero_pedidos)    || 0,
      usuariosActivos:  Number(datos.usuarios_activos)  || 0,
      ticketPromedio:   Number(datos.ticket_promedio)   || 0,
    };
  }
}

module.exports = { AnalyticsService, ESTADOS_VENTA, MAPA_ESTADOS };
