import { useState } from 'react';
import { BASE_URL } from '../services/api';

export default function ViniloDetailModal({ vinilo, open, onClose, extraActions }) {
  const [imgError, setImgError] = useState(false);

  if (!vinilo || !open) return null;

  const estado = (vinilo.estado || '').toLowerCase();
  const estadoClass = {
    aprobado: 'estado-aprobado',
    pendiente: 'estado-pendiente',
    rechazado: 'estado-rechazado',
  }[estado] || 'estado-aprobado';

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-box" onClick={(e) => e.stopPropagation()}>
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="detail-header">
          <div className="detail-header-left">
            <i className="fa-solid fa-record-vinyl detail-header-icon"></i>
            <div className="detail-header-text">
              <h2 className="detail-title">{vinilo.nombre}</h2>
              <span className="detail-artist">{vinilo.artista}</span>
            </div>
          </div>
          <button type="button" className="detail-close" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="detail-divider"></div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="detail-body">
          {/* Imagen con marco */}
          <div className="detail-img-wrap">
            {vinilo.imagenUrl && !imgError ? (
              <img
                src={`${BASE_URL}${vinilo.imagenUrl}`}
                alt={vinilo.nombre}
                className="detail-img"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="detail-img-placeholder">
                <i className="fa-solid fa-record-vinyl"></i>
                <span>Sin imagen</span>
              </div>
            )}
          </div>

          {/* Información */}
          <div className="detail-info">
            <h3 className="detail-name">{vinilo.nombre}</h3>
            <p className="detail-artist-name">{vinilo.artista}</p>

            <div className="detail-price-row">
              <span className="detail-price">${vinilo.precio}</span>
              <span className={`detail-estado ${estadoClass}`}>
                {vinilo.estado}
              </span>
            </div>

            <div className="detail-stock-chip">
              <i className="fa-solid fa-box"></i>
              <span>Stock: {vinilo.stock ?? 0}</span>
            </div>

            {vinilo.descripcion && (
              <p className="detail-desc">{vinilo.descripcion}</p>
            )}
          </div>
        </div>

        {/* ── Footer / Acciones ──────────────────────────────── */}
        <div className="detail-footer">
          {extraActions ? (
            extraActions(vinilo)
          ) : (
            <button type="button" className="detail-btn-primary" onClick={onClose}>
              <i className="fa-solid fa-xmark"></i> Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
