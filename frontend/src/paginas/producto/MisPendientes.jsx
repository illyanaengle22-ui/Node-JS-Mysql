import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../../services/api';
import ViniloDetailModal from '../../components/ViniloDetailModal';

export default function MisPendientes() {
  const [pendientes, setPendientes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [detalle, setDetalle] = useState(null);

  const cargar = async () => {
    try {
      const data = await api.listarProductos();
      const arr = Array.isArray(data) ? data : data.productos || [];
      setPendientes(arr.filter((p) => p.estado === 'pendiente'));
    } catch (err) { setMensaje(err.message); }
  };
  useEffect(() => { cargar(); }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Mis vinilos pendientes</h1>
      </div>

      {mensaje && <p className="auth-error">{mensaje}</p>}

      {pendientes.length === 0 ? (
        <p className="empty-state">No tienes vinilos pendientes de aprobación.</p>
      ) : (
        <div className="product-grid">
          {pendientes.map((p) => (
            <div className="product-card" key={p.id}>
              {p.imagenUrl ? <img src={`${BASE_URL}${p.imagenUrl}`} alt={p.nombre} /> : <div className="no-image">♪</div>}
              <h3>{p.nombre}</h3>
              <p className="artist">{p.artista}</p>
              <p className="price">${p.precio}</p>
              <span className={`badge-estado ${p.estado}`}>{p.estado}</span>
              <div className="product-actions">
                <button className="btn-ver" onClick={() => setDetalle(p)}>Ver</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ViniloDetailModal
        vinilo={detalle}
        open={!!detalle}
        onClose={() => setDetalle(null)}
      />
    </div>
  );
}