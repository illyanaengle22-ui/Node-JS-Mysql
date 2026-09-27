import { BASE_URL } from '../services/api';
import FormModal from './FormModal';

export default function ViniloDetailModal({ vinilo, open, onClose, extraActions }) {
  if (!vinilo) return null;

  return (
    <FormModal
      title={`Detalle: ${vinilo.nombre}`}
      open={open}
      onClose={onClose}
      onSubmit={onClose}
      submitLabel="Cerrar"
    >
      <div className="detail-modal">
        {vinilo.imagenUrl && (
          <img
            src={`${BASE_URL}${vinilo.imagenUrl}`}
            alt={vinilo.nombre}
            className="detail-modal-img"
          />
        )}
        <div className="detail-modal-info">
          <p><strong>Artista:</strong> {vinilo.artista}</p>
          <p><strong>Precio:</strong> ${vinilo.precio}</p>
          <p><strong>Stock:</strong> {vinilo.stock ?? 0}</p>
          <p><strong>Estado:</strong>{' '}
            <span className={`badge badge-${vinilo.estado}`}>{vinilo.estado}</span>
          </p>
          {vinilo.descripcion && (
            <p><strong>Descripción:</strong> {vinilo.descripcion}</p>
          )}
        </div>
      </div>

      {extraActions && (
        <div className="detail-modal-actions">
          {extraActions(vinilo)}
        </div>
      )}
    </FormModal>
  );
}