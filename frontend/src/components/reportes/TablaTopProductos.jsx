/**
 * TablaTopProductos.jsx
 * Ranking de productos por unidades vendidas y monto recaudado.
 * Incluye barra visual de progreso relativo.
 */

export default function TablaTopProductos({
  datos,
  cargando,
  error,
  titulo = 'Top productos por ventas',
  mensajeVacio = 'Sin ventas en el período seleccionado',
  icono = 'fa-trophy',
}) {
  const filas = datos ?? [];
  if (cargando) return <div className="chart-estado cargando"><span className="spinner" />Cargando top productos…</div>;
  if (error)    return <div className="chart-estado error"><i className="fa-solid fa-triangle-exclamation" /> {error}</div>;
  if (!filas.length) return <div className="chart-estado vacio"><i className="fa-solid fa-record-vinyl" /> {mensajeVacio}</div>;

  const maxUnidades = Math.max(...filas.map((d) => d.unidadesVendidas), 1);

  return (
    <div className="chart-wrapper">
      <h3 className="chart-titulo">
        <i className={`fa-solid ${icono}`} /> {titulo}
      </h3>
      <div className="top-tabla">
        {filas.map((p, i) => (
          <div key={p.productoId} className="top-fila">
            {/* Posición */}
            <span className={`top-pos${i < 3 ? ` top-pos--${i + 1}` : ''}`}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
            </span>

            {/* Info del producto */}
            <div className="top-info">
              <p className="top-nombre">{p.nombre}</p>
              <p className="top-artista">{p.artista}</p>
              {/* Barra de progreso relativa */}
              <div className="top-barra-bg">
                <div
                  className="top-barra-fill"
                  style={{ width: `${(p.unidadesVendidas / maxUnidades) * 100}%` }}
                />
              </div>
            </div>

            {/* Métricas */}
            <div className="top-metricas">
              <span className="top-unidades">
                <i className="fa-solid fa-boxes-stacked" /> {p.unidadesVendidas} uds
              </span>
              <span className="top-monto">
                ${Number(p.montoRecaudado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <span className="top-pedidos">
                {p.numeroPedidos} pedido{p.numeroPedidos !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
