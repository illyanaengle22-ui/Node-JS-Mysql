/**
 * AdminReportes.jsx
 * Vista principal del dashboard analítico (solo admin).
 * Carga los 5 endpoints en paralelo con Promise.all al cambiar los filtros.
 * Estados de carga, error y "sin datos" en cada gráfica.
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import FiltroFechas     from '../../components/reportes/FiltroFechas';
import GraficoIngresos  from '../../components/reportes/GraficoIngresos';
import GraficoEstados   from '../../components/reportes/GraficoEstados';
import TablaTopProductos from '../../components/reportes/TablaTopProductos';

// ── Tarjeta de resumen reutilizable ──────────────────────────────────────────
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

// ── Estado inicial ────────────────────────────────────────────────────────────
const ESTADO_VACIO = { datos: null, cargando: false, error: null };

function toISO(d) { return d.toISOString().slice(0, 10); }

function rangoDefecto() {
  const hoy   = new Date();
  const inicio = new Date(hoy); inicio.setDate(hoy.getDate() - 6);
  return { desde: toISO(inicio), hasta: toISO(hoy) };
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AdminReportes({ embedded = false }) {
  const [rango,   setRango]   = useState(rangoDefecto);
  const [agrupar, setAgrupar] = useState('dia');
  const [limite,  setLimite]  = useState(5);

  const [resumen,       setResumen]       = useState(ESTADO_VACIO);
  const [ingresos,      setIngresos]      = useState(ESTADO_VACIO);
  const [estados,       setEstados]       = useState(ESTADO_VACIO);
  const [topProductos,  setTopProductos]  = useState(ESTADO_VACIO);
  const [ticket,        setTicket]        = useState(ESTADO_VACIO);

  // ── Carga de datos ────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    // Marcar todos como cargando
    const loading = { datos: null, cargando: true, error: null };
    setResumen(loading); setIngresos(loading);
    setEstados(loading); setTopProductos(loading); setTicket(loading);

    const { desde, hasta } = rango;

    const [r1, r2, r3, r4, r5] = await Promise.allSettled([
      api.reporteResumen({ desde, hasta }),
      api.reporteIngresos({ desde, hasta, agrupar }),
      api.reporteEstados({ desde, hasta }),
      api.reporteTopProductos({ desde, hasta, limite }),
      api.reporteTicketPromedio({ desde, hasta }),
    ]);

    const unwrap = (r) =>
      r.status === 'fulfilled'
        ? { datos: r.value, cargando: false, error: null }
        : { datos: null,    cargando: false, error: r.reason?.message || 'Error al cargar' };

    setResumen(unwrap(r1));
    setIngresos(unwrap(r2));
    setEstados(unwrap(r3));
    setTopProductos(unwrap(r4));
    setTicket(unwrap(r5));
  }, [rango, agrupar, limite]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Render ────────────────────────────────────────────────────────────────
  const res = resumen.datos;
  const tkt = ticket.datos;

  return (
    <div id="admin-reportes" className={embedded ? 'reportes-embedded' : ''}>
      {/* Encabezado */}
      <div className="page-header" style={embedded ? { marginTop: 36 } : undefined}>
        <div>
          {embedded ? (
            <h2>Métricas y Reportes Analíticos</h2>
          ) : (
            <h1>Reportes Analíticos</h1>
          )}
          <p className="page-subtitle">
            Métricas de rendimiento comercial · solo admin
          </p>
        </div>
        <button
          id="btn-recargar-reportes"
          className="btn-ghost"
          onClick={cargar}
          title="Recargar datos"
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
            icono="fa-dollar-sign"
            label="Ingresos totales"
            valor={
              resumen.cargando ? '…'
              : resumen.error   ? '—'
              : `$${Number(res?.ingresosTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            }
            sublabel="Solo pedidos aprobados"
          />
          <ResumenCard
            icono="fa-box"
            label="Pedidos confirmados"
            valor={
              resumen.cargando ? '…'
              : resumen.error   ? '—'
              : (res?.numeroPedidos ?? '0')
            }
            sublabel="En el período"
          />
          <ResumenCard
            icono="fa-users"
            label="Compradores activos"
            valor={
              resumen.cargando ? '…'
              : resumen.error   ? '—'
              : (res?.usuariosActivos ?? '0')
            }
            sublabel="Con pedido aprobado"
          />
          <ResumenCard
            icono="fa-receipt"
            label="Ticket promedio"
            valor={
              ticket.cargando ? '…'
              : ticket.error   ? '—'
              : `$${Number(tkt?.ticketPromedioPedido || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            }
            sublabel="Por pedido aprobado"
          />
        </div>
      </section>

      {/* Gráfica de ingresos */}
      <section className="reporte-seccion reporte-seccion--amplia">
        <GraficoIngresos
          datos={ingresos.datos}
          agrupar={agrupar}
          cargando={ingresos.cargando}
          error={ingresos.error}
        />
      </section>

      {/* Gráfica de estados + Tabla top productos */}
      <section className="reporte-seccion reporte-seccion--doble">
        <GraficoEstados
          datos={estados.datos}
          cargando={estados.cargando}
          error={estados.error}
        />
        <TablaTopProductos
          datos={topProductos.datos}
          cargando={topProductos.cargando}
          error={topProductos.error}
        />
      </section>

      {/* Ticket promedio por usuario */}
      {!ticket.cargando && !ticket.error && tkt && (
        <section className="reporte-seccion">
          <div className="chart-wrapper reporte-ticket">
            <h3 className="chart-titulo">
              <i className="fa-solid fa-user-tag" /> Desglose de ticket promedio
            </h3>
            <div className="reporte-ticket-grid">
              <div className="reporte-ticket-item">
                <p className="reporte-ticket-etiqueta">Por pedido</p>
                <p className="reporte-ticket-valor">
                  ${Number(tkt.ticketPromedioPedido).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="reporte-ticket-item">
                <p className="reporte-ticket-etiqueta">Por usuario</p>
                <p className="reporte-ticket-valor">
                  ${Number(tkt.ticketPromedioUsuario).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="reporte-ticket-item">
                <p className="reporte-ticket-etiqueta">Total pedidos</p>
                <p className="reporte-ticket-valor">{tkt.totalPedidos}</p>
              </div>
              <div className="reporte-ticket-item">
                <p className="reporte-ticket-etiqueta">Usuarios únicos</p>
                <p className="reporte-ticket-valor">{tkt.totalUsuarios}</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
