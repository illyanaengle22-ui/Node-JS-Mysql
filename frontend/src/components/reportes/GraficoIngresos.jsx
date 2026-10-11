/**
 * GraficoIngresos.jsx
 * Gráfica de barras (con línea de tendencia) para la serie temporal de ingresos.
 * Usa Recharts: BarChart + Line combinados con ComposedChart.
 */
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function formatearPeriodo(isoStr, agrupar) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (agrupar === 'mes')    return `${MESES_ES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  if (agrupar === 'semana') return `Sem ${d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`;
  return d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: {p.name === 'Ingresos' ? `$${Number(p.value).toFixed(2)}` : p.value}
        </p>
      ))}
    </div>
  );
}

export default function GraficoIngresos({ datos, agrupar = 'mes', cargando, error }) {
  const filas = datos ?? [];
  if (cargando) return <div className="chart-estado cargando"><span className="spinner" />Cargando ingresos…</div>;
  if (error)    return <div className="chart-estado error"><i className="fa-solid fa-triangle-exclamation" /> {error}</div>;
  if (!filas.length) return <div className="chart-estado vacio"><i className="fa-solid fa-chart-simple" /> Sin datos en el período seleccionado</div>;

  const data = filas.map((d) => ({
    periodo:  formatearPeriodo(d.periodo, agrupar),
    Ingresos: Number(d.ingresos),
    Pedidos:  Number(d.pedidos),
  }));

  return (
    <div className="chart-wrapper">
      <h3 className="chart-titulo">
        <i className="fa-solid fa-chart-column" /> Ingresos por período
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(166,138,100,0.2)" />
          <XAxis
            dataKey="periodo"
            tick={{ fill: '#a68a64', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(166,138,100,0.3)' }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#a68a64', fontSize: 11 }}
            axisLine={false}
            tickFormatter={(v) => `$${v.toLocaleString()}`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#a68a64', fontSize: 11 }}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: '#fdf8f0', fontSize: '0.85rem' }}
          />
          <Bar
            yAxisId="left"
            dataKey="Ingresos"
            fill="#b83b3b"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="Pedidos"
            stroke="#d4a373"
            strokeWidth={2}
            dot={{ fill: '#d4a373', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
