import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardPedido() {
  const { auth, cerrarSesion } = useAuth();
  const [catalogo, setCatalogo] = useState([]);
  const [misPedidos, setMisPedidos] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [mensaje, setMensaje] = useState('');

  const cargarDatos = async () => {
    try {
      const [productos, pedidos] = await Promise.all([api.listarProductos(), api.listarPedidos()]);
      setCatalogo(productos);
      setMisPedidos(pedidos);
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
      setMensaje(`Solicitud enviada · total: $${data.pedido.total}`);
      cargarDatos();
    } catch (err) {
      setMensaje(err.message);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Catálogo de vinilos</h1>
        <div>
          <span>Hola, {auth.nombre}</span>
          <button onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      {mensaje && <p className="auth-success">{mensaje}</p>}

      <section className="panel">
        <h2>Disponibles</h2>
        <div className="product-grid">
          {catalogo.map((p) => (
            <div className="product-card" key={p.id}>
              {p.imagenUrl && <img src={`${BASE_URL}${p.imagenUrl}`} alt={p.nombre} />}
              <h3>{p.nombre}</h3>
              <p>{p.artista}</p>
              <p>${p.precio}</p>
              <input
                type="number"
                min="1"
                placeholder="Cantidad"
                value={cantidades[p.id] || 1}
                onChange={(e) => setCantidades({ ...cantidades, [p.id]: e.target.value })}
              />
              <button onClick={() => solicitar(p.id)}>Solicitar</button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Mis pedidos</h2>
        <table>
          <thead>
            <tr>
              <th>Vinilo</th>
              <th>Cantidad</th>
              <th>Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {misPedidos.map((pd) => (
              <tr key={pd.id}>
                <td>{pd.producto_nombre} — {pd.artista}</td>
                <td>{pd.cantidad}</td>
                <td>${pd.total}</td>
                <td>{pd.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
