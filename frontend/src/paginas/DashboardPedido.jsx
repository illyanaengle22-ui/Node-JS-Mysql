import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PedidoReportes from '../components/reportes/PedidoReportes';

export default function DashboardPedido() {
  const { auth, cerrarSesion } = useAuth();
  const [catalogo, setCatalogo] = useState([]);
  const [misPedidos, setMisPedidos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [mensaje, setMensaje] = useState('');

  const cargarDatos = async () => {
    try {
      const [productos, pedidos] = await Promise.all([
        api.listarProductos().catch(() => []),
        api.listarPedidos().catch(() => []),
      ]);
      setCatalogo(Array.isArray(productos) ? productos : productos.productos || []);
      setMisPedidos(Array.isArray(pedidos) ? pedidos : pedidos.pedidos || []);
    } catch (err) {
      setMensaje(err.message);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const solicitar = async (productoId) => {
    const cantidad = Number(cantidades[productoId] || 1);
    try {
      const data = await api.crearPedido({ productoId, cantidad });
      setMensaje(`Solicitud enviada exitosamente · total: $${data?.pedido?.total || ''}`);
      cargarDatos();
    } catch (err) {
      setMensaje(err.message);
    }
  };

  return (
    <div className="dashboard-page" style={{ padding: '24px 32px' }}>
      <header className="page-header">
        <div>
          <h1>Panel de Comprador</h1>
          <p className="page-subtitle">Bienvenido, {auth?.nombre} · Tus métricas de compra y pedidos</p>
        </div>
        {cerrarSesion && (
          <button className="btn-ghost" onClick={cerrarSesion}>
            <i className="fa-solid fa-right-from-bracket" /> Cerrar sesión
          </button>
        )}
      </header>

      {/* Métricas, Gráficas y Filtros de Compras */}
      <PedidoReportes />

      {mensaje && <p className="auth-success" style={{ marginTop: 16 }}>{mensaje}</p>}

      {/* Catálogo de vinilos disponibles */}
      <section style={{ marginTop: 32 }}>
        <div className="page-header">
          <h2>Catálogo de Vinilos Disponibles</h2>
          <span className="crud-count">{catalogo.length} vinilos</span>
        </div>
        <div className="product-grid">
          {catalogo.map((p) => (
            <div className="product-card" key={p.id}>
              {p.imagenUrl ? (
                <img src={`${BASE_URL}${p.imagenUrl}`} alt={p.nombre} />
              ) : (
                <div className="no-image">♪</div>
              )}
              <h3>{p.nombre}</h3>
              <p className="artist">{p.artista}</p>
              <p className="price">${Number(p.precio).toFixed(2)}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  type="number"
                  min="1"
                  max={p.stock || 99}
                  style={{ width: 65, textAlign: 'center' }}
                  value={cantidades[p.id] || 1}
                  onChange={(e) => setCantidades({ ...cantidades, [p.id]: e.target.value })}
                />
                <button className="btn-ver" onClick={() => solicitar(p.id)}>
                  Solicitar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Historial de mis pedidos */}
      <section style={{ marginTop: 32 }}>
        <div className="page-header">
          <h2>Mis Pedidos Realizados</h2>
          <span className="crud-count">{misPedidos.length} pedidos</span>
        </div>
        {misPedidos.length === 0 ? (
          <p className="empty-state">Aún no has realizado pedidos.</p>
        ) : (
          <div className="crud-table-wrap">
            <table className="crud-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vinilo</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {misPedidos.map((pd) => (
                  <tr key={pd.id}>
                    <td>{pd.id}</td>
                    <td>{pd.producto_nombre || pd.nombre} {pd.artista && `— ${pd.artista}`}</td>
                    <td>{pd.cantidad || (pd.items?.reduce((s, i) => s + (i.cantidad || 0), 0) ?? 1)}</td>
                    <td>${Number(pd.total).toFixed(2)}</td>
                    <td><span className={`badge-estado ${pd.estado}`}>{pd.estado}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
