import { BASE_URL } from '../services/api';

export default function ViniloCard({ vinilo, onVer, onSolicitar, mostrarSolicitar = false }) {
  const { nombre, artista, precio, imagenUrl, stock } = vinilo;

  return (
    <div className="product-card">
      {imagenUrl ? (
        <img
          src={`${BASE_URL}${imagenUrl}`}
          alt={nombre}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="no-image">♪</div>
      )}

      <h3>{nombre}</h3>
      <p className="artist">{artista}</p>
      <p className="price">${precio}</p>
      {typeof stock === 'number' && (
        <p className="stock">Stock: {stock}</p>
      )}

      <div className="product-actions">
        {onVer && (
          <button className="btn-ghost" onClick={() => onVer(vinilo)}>Ver</button>
        )}
        {mostrarSolicitar && (
          <button
            className="btn-success"
            onClick={() => onSolicitar?.(vinilo)}
            disabled={stock <= 0}
          >
            {stock > 0 ? (
              <>
                <i className="fa-solid fa-cart-plus"></i> Añadir
              </>
            ) : (
              'Sin stock'
            )}
          </button>
        )}
      </div>
    </div>
  );
}