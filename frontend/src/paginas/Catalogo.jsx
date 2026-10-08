import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ViniloCard from '../components/ViniloCard';
import ViniloDetailModal from '../components/ViniloDetailModal';

export default function Catalogo() {
  const { auth } = useAuth();
  const { addToCart } = useCart();
  const [vinilos, setVinilos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [solicitando, setSolicitando] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  const cargar = async () => {
    try {
      const data = await api.listarCatalogo();
      const arr = Array.isArray(data) ? data : data.productos || [];
      // Solo mostrar aprobados
      setVinilos(arr.filter((v) => v.estado === 'aprobado'));
    } catch (err) {
      setMensaje(err.message);
    }
  };

  useEffect(() => { cargar(); }, []);

  const filtrados = busqueda.trim()
    ? vinilos.filter((v) =>
        `${v.nombre} ${v.artista}`.toLowerCase().includes(busqueda.toLowerCase())
      )
    : vinilos;

  const abrirSolicitud = (vinilo) => {
    setSolicitando(vinilo);
    setCantidad(1);
  };

  const confirmarSolicitud = () => {
    addToCart(solicitando, cantidad);
    setMensaje(`Añadido al carrito: ${solicitando.nombre} x${cantidad}`);
    setSolicitando(null);
    setTimeout(() => setMensaje(''), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Catálogo de vinilos</h1>
        <input
          className="crud-search"
          type="text"
          placeholder="Buscar por título o artista..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {mensaje && <p className="auth-success">{mensaje}</p>}

      {filtrados.length === 0 ? (
        <p className="empty-state">No hay vinilos disponibles por ahora.</p>
      ) : (
        <div className="product-grid">
          {filtrados.map((v) => (
            <ViniloCard
              key={v.id}
              vinilo={v}
              onVer={setDetalle}
              onSolicitar={abrirSolicitud}
              mostrarSolicitar={auth?.rol === 'pedido'}
            />
          ))}
        </div>
      )}

      <ViniloDetailModal
        vinilo={detalle}
        open={!!detalle}
        onClose={() => setDetalle(null)}
      />

      {solicitando && (
        <div className="modal-overlay" onClick={() => setSolicitando(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Solicitar vinilo</h2>
              <button className="modal-close" onClick={() => setSolicitando(null)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>{solicitando.nombre}</strong> — {solicitando.artista}</p>
              <p>Precio unitario: ${solicitando.precio}</p>
              <label>Cantidad
                <input
                  type="number"
                  min="1"
                  max={solicitando.stock}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </label>
              <p>Total estimado: <strong>${(Number(solicitando.precio) * Number(cantidad || 0)).toFixed(2)}</strong></p>
              <div className="modal-footer">
                <button className="btn-ghost" onClick={() => setSolicitando(null)}>Cancelar</button>
                <button onClick={confirmarSolicitud}>Confirmar solicitud</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}