/**
 * ProductoReportes.jsx
 * Dashboard analítico de ventas para el rol "producto".
 * Métricas exclusivas de los productos del usuario:
 *  - Resumen (unidades, ingresos, pedidos, alertas)
 *  - Serie de ingresos con filtro temporal y agrupación
 *  - Estados de pedidos sobre sus vinilos
 *  - Top de sus productos vendidos
 *  - Alerta y lista de stock bajo (<= 5)
 */
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import FiltroFechas from './FiltroFechas';
import GraficoIngresos from './GraficoIngresos';
import GraficoEstados from './GraficoEstados';
import TablaTopProductos from './TablaTopProductos';

function ResumenCard({ icono, label, valor, sublabel, alerta = false }) {
  return (
    <div className={`reporte-stat-card ${alerta ? 'reporte-stat-card--alerta' : ''}`}>
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

export default function ProductoReportes({ embedded = false }) {
  const [rango, setRango] = useState(rangoDefecto);
  const [agrupar, setAgrupar] = useState('dia');
  const [limite, setLimite] = useState(5);

  const [resumen, setResumen] = useState(ESTADO_VACIO);
  const [ingresos, setIngresos] = useState(ESTADO_VACIO);
  const [estados, setEstados] = useState(ESTADO_VACIO);
  const [topProductos, setTopProductos] = useState(ESTADO_VACIO);
  const [stockBajo, setStockBajo] = useState({ datos: [], cargando: false, error: null });

  const cargar = useCallback(async () => {
    const loading = { datos: null, cargando: true, error: null };
    setResumen(loading);
    setIngresos(loading);
    setEstados(loading);
    setTopProductos(loading);
    setStockBajo((prev) => ({ ...prev, cargando: true, error: null }));

    const { desde, hasta } = rango;

    const [rRes, rIng, rEst, rTop, rStk] = await Promise.allSettled([
      api.misVentasResumen({ desde, hasta }),
      api.misVentasIngresos({ desde, hasta, agrupar }),
      api.misVentasEstados({ desde, hasta }),
      api.misVentasTop({ desde, hasta, limite }),
      api.misVentasStockBajo(),
    ]);

    const unwrap = (r, defaultVal = null) =>
      r.status === 'fulfilled'
        ? { datos: r.value, cargando: false, error: null }
        : { datos: defaultVal, cargando: false, error: r.reason?.message || 'Error al cargar' };

    setResumen(unwrap(rRes));
    setIngresos(unwrap(rIng));
    setEstados(unwrap(rEst));
    setTopProductos(unwrap(rTop));
    setStockBajo(unwrap(rStk, []));
  }, [rango, agrupar, limite]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const res = resumen.datos;
  const listaStockBajo = stockBajo.datos || [];

  return (
    <div id="producto-reportes" className={embedded ? 'reportes-embedded' : ''}>
      {/* Encabezado */}
      <div className="page-header" style={embedded ? { marginTop: 28 } : undefined}>
        <div>
          <h2>Métricas y Ventas de Mis Vinilos</h2>
          <p className="page-subtitle">Rendimiento comercial exclusivo de tus productos registrados</p>
        </div>
        <button
          id="btn-recargar-ventas"
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
            icono="fa-dollar-sign"
            label="Ingresos por ventas"
            valor={
              resumen.cargando
                ? '…'
                : resumen.error
                ? '—'
                : `$${Number(res?.ingresosTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            }
            sublabel="Pedidos aprobados"
          />
          <ResumenCard
            icono="fa-boxes-stacked"
            label="Unidades vendidas"
            valor={
              resumen.cargando
                ? '…'
                : resumen.error
                ? '—'
                : `${res?.unidadesVendidas ?? 0} uds`
            }
            sublabel="En el período seleccionado"
          />
          <ResumenCard
            icono="fa-receipt"
            label="Pedidos de mis vinilos"
            valor={
              resumen.cargando
                ? '…'
                : resumen.error
                ? '—'
                : (res?.numeroPedidos ?? '0')
            }
            sublabel="Con tus vinilos incluidos"
          />
          <ResumenCard
            icono="fa-triangle-exclamation"
            label="Stock bajo (≤ 5)"
            valor={
              stockBajo.cargando
                ? '…'
                : stockBajo.error
                ? '—'
                : `${listaStockBajo.length} vinilos`
            }
            sublabel={listaStockBajo.length > 0 ? 'Requieren reposición' : 'Niveles óptimos'}
            alerta={listaStockBajo.length > 0}
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
          titulo="Ingresos por período de mis vinilos"
          metricaMonetaria="Ingresos"
          icono="fa-chart-line"
        />
      </section>

      {/* Gráfica de estados + Tabla top productos */}
      <section className="reporte-seccion reporte-seccion--doble">
        <GraficoEstados
          datos={estados.datos}
          cargando={estados.cargando}
          error={estados.error}
          titulo="Estados de pedidos de mis vinilos"
        />
        <TablaTopProductos
          datos={topProductos.datos}
          cargando={topProductos.cargando}
          error={topProductos.error}
          titulo="Mis vinilos más vendidos"
          mensajeVacio="Sin ventas en el período seleccionado"
          icono="fa-fire"
        />
      </section>

      {/* Sección Stock Bajo (<= 5) */}
      <section className="reporte-seccion">
        <div className="chart-wrapper">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="chart-titulo" style={{ margin: 0 }}>
              <i className="fa-solid fa-boxes-packing" /> Inventario con Stock Bajo (≤ 5 unidades)
            </h3>
            {listaStockBajo.length > 0 && (
              <span className="badge-estado rechazada">
                {listaStockBajo.length} producto{listaStockBajo.length !== 1 ? 's' : ''} crítico{listaStockBajo.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {stockBajo.cargando ? (
            <div className="chart-estado cargando"><span className="spinner" />Consultando stock…</div>
          ) : stockBajo.error ? (
            <div className="chart-estado error"><i className="fa-solid fa-triangle-exclamation" /> {stockBajo.error}</div>
          ) : listaStockBajo.length === 0 ? (
            <div className="chart-estado vacio">
              <i className="fa-solid fa-circle-check" style={{ color: '#4a7c59' }} />
              <span> Todos tus vinilos cuentan con stock adecuado (&gt; 5 unidades).</span>
            </div>
          ) : (
            <div className="crud-table-wrap">
              <table className="crud-table">
                <thead>
                  <tr>
                    <th>Vinilo</th>
                    <th>Artista</th>
                    <th>Precio</th>
                    <th>Stock actual</th>
                    <th>Estado catálogo</th>
                  </tr>
                </thead>
                <tbody>
                  {listaStockBajo.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.nombre}</td>
                      <td>{p.artista}</td>
                      <td>${Number(p.precio).toFixed(2)}</td>
                      <td>
                        <span
                          className={`badge-estado ${p.stock === 0 ? 'rechazado' : 'pendiente'}`}
                          style={{ fontWeight: 700 }}
                        >
                          {p.stock === 0 ? 'Agotado (0)' : `${p.stock} unidad${p.stock !== 1 ? 'es' : ''}`}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-estado ${p.estado}`}>{p.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
