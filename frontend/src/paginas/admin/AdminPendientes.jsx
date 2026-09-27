import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../../services/api';
import ViniloDetailModal from '../../components/ViniloDetailModal';

export default function AdminPendientes() {
  const [pendientes, setPendientes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [detalle, setDetalle] = useState(null);

  const cargar = async () => {
    try {
      const data = await api.listarProductosPendientes();
      setPendientes(Array.isArray(data) ? data : data.productos || []);
    } catch (err) { setMensaje(err.message); }
  };
  useEffect(() => { cargar(); }, []);

  const aprobar = async (p) => {
    try { await api.aprobarProducto(p.id); cargar(); }
    catch (err) { setMensaje(err.message); }
  };

  const rechazar = async (p) => {
    if (!confirm(`¿Rechazar "${p.nombre}"? Se eliminará de pendientes.`)) return;
    try { await api.rechazarProducto(p.id); cargar(); }
    catch (err) { setMensaje(err.message); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Productos pendientes de aprobación</h1>
      </div>

      {mensaje && <p className="auth-error">{mensaje}</p>}

      {pendientes.length === 0 ? (
        <p className="empty-state">No hay productos pendientes por aprobar.</p>
      ) : (
        <div className="product-grid">
          {pendientes.map((p) => (
            <div className="product-card" key={p.id}>
              {p.imagenUrl ? (
                <img src={`${BASE_URL}${p.imagenUrl}`} alt={p.nombre} />
              ) : (
                <div className="no-image">♪</div>
              )}
              <h3>{p.nombre}</h3>
              <p className="artist">{p.artista}</p>
              <p className="price">${p.precio}</p>
              <p className="stock">Stock: {p.stock ?? 0}</p>

              <div className="product-actions">
                <button className="btn-ver" onClick={() => setDetalle(p)}>Ver</button>
                <button className="btn-aprobar" onClick={() => aprobar(p)}>Aprobar</button>
                <button className="btn-warn" onClick={() => rechazar(p)}>Rechazar</button>
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