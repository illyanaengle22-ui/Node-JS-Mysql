/**
 * GraficoEstados.jsx
 * Pie chart de distribución de pedidos por estado.
 * Usa Recharts: PieChart + Pie + Cell.
 * Mapea estados reales a etiquetas analíticas legibles.
 */
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Paleta coherente con el tema oscuro rojo-marrón
const COLORES = {
  Pendiente: '#d4a373',   // amarillo vintage
  Pagado:    '#4a7c59',   // verde éxito
  Cancelado: '#b83b3b',   // rojo peligro
};
const COLOR_DEFAULT = '#6b6b6b';

function getColor(categoria) {
  return COLORES[categoria] || COLOR_DEFAULT;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{name}</p>
      <p style={{ margin: '2px 0' }}>Pedidos: <strong>{value}</strong></p>
      <p style={{ margin: '2px 0', color: '#d4a373' }}>{p.porcentaje}%</p>
    </div>
  );
}

function CustomLabel({ cx, cy, midAngle, outerRadius, porcentaje }) {
  if (porcentaje < 5) return null;
  const RADIAN = Math.PI / 180;
  const r = outerRadius + 24;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fdf8f0" textAnchor="middle" fontSize={11}>
      {porcentaje}%
    </text>
  );
}

export default function GraficoEstados({ datos, cargando, error }) {
  const filas = datos ?? [];
  if (cargando) return <div className="chart-estado cargando"><span className="spinner" />Cargando estados…</div>;
  if (error)    return <div className="chart-estado error"><i className="fa-solid fa-triangle-exclamation" /> {error}</div>;
  if (!filas.length) return <div className="chart-estado vacio"><i className="fa-solid fa-circle-half-stroke" /> Sin datos en el período seleccionado</div>;

  // Agrupar por categoría analítica (varios estados reales → misma categoría)
  const agrupado = {};
  for (const d of filas) {
    const cat = d.categoriaAnalitica || d.estadoReal;
    if (!agrupado[cat]) agrupado[cat] = { conteo: 0, porcentaje: 0 };
    agrupado[cat].conteo    += d.conteo;
    agrupado[cat].porcentaje = +(agrupado[cat].porcentaje + d.porcentaje).toFixed(2);
  }

  const data = Object.entries(agrupado).map(([cat, v]) => ({
    name:       cat,
    value:      v.conteo,
    porcentaje: v.porcentaje,
  }));

  return (
    <div className="chart-wrapper">
      <h3 className="chart-titulo">
        <i className="fa-solid fa-chart-pie" /> Estado de pedidos
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            dataKey="value"
            labelLine={false}
            label={CustomLabel}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={getColor(entry.name)} stroke="rgba(0,0,0,0.3)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span style={{ color: '#fdf8f0', fontSize: '0.85rem' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
