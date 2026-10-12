/**
 * PedidoReportes.jsx
 * Dashboard analítico de compras y gastos para el rol "pedido".
 * Métricas exclusivas de las compras del usuario autenticado:
 *  - Gasto total
 *  - Número de pedidos
 *  - Ticket promedio
 *  - Gasto por período (con agrupación día/semana/mes)
 *  - Pedidos por estado
 *  - Top vinilos más comprados
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import FiltroFechas from './FiltroFechas';
import GraficoIngresos from './GraficoIngresos';
import GraficoEstados from './GraficoEstados';
import TablaTopProductos from './TablaTopProductos';

function ResumenCard({ icono, label, valor, sublabel }) {
  return (
    <div className="reporte-stat-card">
      <i className={`fa-solid ${icono} reporte-stat-icon`} />
      <div className="reporte-stat-body">
        <p className="reporte-stat-label">{label}</p>
        <p className="reporte-stat-valor">{valor}</p>
        {sublabel && <p className="reporte-stat-sub">{sublabel}</p>}
      </div>
    </div>
  );
}

const ESTADO_VACIO = { datos: null, cargando: false, error: null };

function toLocalYMD(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function rangoDefecto() {
  const hoy = new Date();
  const inicio = new Date(hoy);
  inicio.setDate(hoy.getDate() - 29); // 30 días
  return { desde: toLocalYMD(inicio), hasta: toLocalYMD(hoy) };
}

export default function PedidoReportes({ embedded = false }) {
  const [rango, setRango] = useState(rangoDefecto);
  const [agrupar, setAgrupar] = useState('dia');
  const [limite, setLimite] = useState(5);

  const [resumen, setResumen] = useState(ESTADO_VACIO);
  const [gasto, setGasto] = useState(ESTADO_VACIO);
  const [estados, setEstados] = useState(ESTADO_VACIO);
  const [topProductos, setTopProductos] = useState(ESTADO_VACIO);

  const cargar = useCallback(async () => {
    const loading = { datos: null, cargando: true, error: null };
    setResumen(loading);
    setGasto(loading);
    setEstados(loading);
    setTopProductos(loading);

    const { desde, hasta } = rango;

    const [rRes, rGas, rEst, rTop] = await Promise.allSettled([
      api.misComprasResumen({ desde, hasta }),
      api.misComprasGasto({ desde, hasta, agrupar }),
      api.misComprasEstados({ desde, hasta }),
      api.misComprasTop({ desde, hasta, limite }),
    ]);

    const unwrap = (r) =>
      r.status === 'fulfilled'
        ? { datos: r.value, cargando: false, error: null }
        : { datos: null, cargando: false, error: r.reason?.message || 'Error al cargar' };

    setResumen(unwrap(rRes));
    setGasto(unwrap(rGas));
    setEstados(unwrap(rEst));
    setTopProductos(unwrap(rTop));
  }, [rango, agrupar, limite]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const res = resumen.datos;

  return (
    <div id="pedido-reportes" className={embedded ? 'reportes-embedded' : ''}>
      {/* Encabezado */}
      <div className="page-header" style={embedded ? { marginTop: 28 } : undefined}>
        <div>
          <h2>Métricas y Resumen de Mis Compras</h2>
          <p className="page-subtitle">Control de tu gasto y seguimiento analítico de pedidos</p>
        </div>
        <button
          id="btn-recargar-compras"
          className="btn-ghost"
          onClick={cargar}
          title="Actualizar métricas"
        >
          <i className="fa-solid fa-rotate-right" /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <section className="reporte-seccion">
        <FiltroFechas
          onChange={setRango}
          agrupar={agrupar}
          onAgruparChange={setAgrupar}
          limite={limite}
          onLimiteChange={setLimite}
        />
      </section>

      {/* Tarjetas de resumen */}
      <section className="reporte-seccion">
        <div className="reporte-stats-grid">
          <ResumenCard
            icono="fa-wallet"
            label="Gasto total"
            valor={
              resumen.cargando
                ? '…'
                : resumen.error
                ? '—'
                : `$${Number(res?.gastoTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            }
            sublabel="En compras aprobadas"
          />
          <ResumenCard
            icono="fa-box-open"
            label="Nº de pedidos"
            valor={
              resumen.cargando
                ? '…'
                : resumen.error
                ? '—'
                : (res?.numeroPedidos ?? '0')
            }
            sublabel="Pedidos completados"
          />
          <ResumenCard
            icono="fa-receipt"
            label="Ticket promedio"
            valor={
              resumen.cargando
                ? '…'
                : resumen.error
                ? '—'
                : `$${Number(res?.ticketPromedio || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            }
            sublabel="Promedio por pedido"
          />
        </div>
      </section>

      {/* Gráfica de gasto temporal */}
      <section className="reporte-seccion reporte-seccion--amplia">
        <GraficoIngresos
          datos={gasto.datos}
          agrupar={agrupar}
          cargando={gasto.cargando}
          error={gasto.error}
          titulo="Gasto por período"
          metricaMonetaria="Gasto"
          icono="fa-chart-area"
        />
      </section>

      {/* Gráfica de estados + Tabla top productos comprados */}
      <section className="reporte-seccion reporte-seccion--doble">
        <GraficoEstados
          datos={estados.datos}
          cargando={estados.cargando}
          error={estados.error}
          titulo="Mis pedidos por estado"
        />
        <TablaTopProductos
          datos={topProductos.datos}
          cargando={topProductos.cargando}
          error={topProductos.error}
          titulo="Vinilos que más compro"
          mensajeVacio="Sin compras registradas en el período seleccionado"
          icono="fa-record-vinyl"
        />
      </section>
    </div>
  );
}
