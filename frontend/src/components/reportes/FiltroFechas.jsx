/**
 * FiltroFechas.jsx
 * Controles de filtrado temporal para el dashboard de reportes.
 * Calcula desde/hasta en el frontend; el backend solo recibe fechas ISO.
 */
import { useState, useEffect } from 'react';

const PRESETS = [
  { label: 'Hoy',            id: 'hoy' },
  { label: 'Últimos 7 días', id: '7d' },
  { label: 'Este mes',       id: 'mes' },
  { label: 'Últimos 60 días',id: '60d' },
  { label: 'Rango propio',   id: 'custom' },
];

function toISO(d) {
  return d.toISOString().slice(0, 10);
}

function calcularRango(id) {
  const hoy = new Date();
  const hasta = toISO(hoy);
  if (id === 'hoy')   return { desde: hasta, hasta };
  if (id === '7d') {
    const d = new Date(hoy); d.setDate(d.getDate() - 6);
    return { desde: toISO(d), hasta };
  }
  if (id === 'mes') {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    return { desde: toISO(d), hasta };
  }
  if (id === '60d') {
    const d = new Date(hoy); d.setDate(d.getDate() - 59);
    return { desde: toISO(d), hasta };
  }
  return null; // custom
}

export default function FiltroFechas({
  onChange,
  agrupar,
  onAgruparChange,
  limite,
  onLimiteChange,
}) {
  const [preset,    setPreset]    = useState('7d');
  const [desdeCust, setDesdeCust] = useState('');
  const [hastaCust, setHastaCust] = useState('');

  // Emite el rango cuando cambia el preset o el rango custom
  useEffect(() => {
    if (preset !== 'custom') {
      const rango = calcularRango(preset);
      if (rango) onChange(rango);
    }
  }, [preset]); // eslint-disable-line

  const aplicarCustom = () => {
    if (!desdeCust || !hastaCust) return;
    onChange({ desde: desdeCust, hasta: hastaCust });
  };

  return (
    <div className="filtro-fechas">
      {/* Presets */}
      <div className="filtro-presets">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            id={`filtro-preset-${p.id}`}
            className={`btn-ghost filtro-btn${preset === p.id ? ' filtro-btn--active' : ''}`}
            onClick={() => setPreset(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Rango personalizado */}
      {preset === 'custom' && (
        <div className="filtro-custom">
          <label>
            Desde
            <input
              id="filtro-desde"
              type="date"
              value={desdeCust}
              onChange={(e) => setDesdeCust(e.target.value)}
            />
          </label>
          <label>
            Hasta
            <input
              id="filtro-hasta"
              type="date"
              value={hastaCust}
              onChange={(e) => setHastaCust(e.target.value)}
            />
          </label>
          <button id="filtro-aplicar" onClick={aplicarCustom}>Aplicar</button>
        </div>
      )}

      {/* Controles secundarios */}
      <div className="filtro-secundarios">
        {onAgruparChange && (
          <label className="filtro-label">
            Agrupar por
            <select
              id="filtro-agrupar"
              value={agrupar}
              onChange={(e) => onAgruparChange(e.target.value)}
            >
              <option value="dia">Día</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
            </select>
          </label>
        )}
        {onLimiteChange && (
          <label className="filtro-label">
            Top productos
            <select
              id="filtro-limite"
              value={limite}
              onChange={(e) => onLimiteChange(Number(e.target.value))}
            >
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
