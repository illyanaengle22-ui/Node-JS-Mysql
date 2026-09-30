import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'producto', 'pedido'];

export default function DashboardAdmin() {
  const { auth, cerrarSesion } = useAuth();
  const [usuariosPendientes, setUsuariosPendientes] = useState([]);
  const [productosPendientes, setProductosPendientes] = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState({});
  const [mensaje, setMensaje] = useState('');

  const cargarDatos = async () => {
    try {
      const [usuarios, productos] = await Promise.all([
        api.listarUsuariosPendientes(),
        api.listarProductosPendientes(),
      ]);
      setUsuariosPendientes(usuarios);
      setProductosPendientes(productos);
    } catch (err) {
      setMensaje(err.message);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const darAcceso = async (id) => {
    const rol = rolSeleccionado[id] || 'pedido';
    try {
      await api.aprobarUsuario(id, rol);
      cargarDatos();
    } catch (err) {
      setMensaje(err.message);
    }
  };

  const negarAcceso = async (id) => {
    try {
      await api.negarUsuario(id);
      cargarDatos();
    } catch (err) {
      setMensaje(err.message);
    }
  };

  const aprobarProducto = async (id) => {
    try {
      await api.aprobarProducto(id);
      cargarDatos();
    } catch (err) {
      setMensaje(err.message);
    }
  };

  const rechazarProducto = async (id) => {
    try {
      await api.rechazarProducto(id);
      cargarDatos();
    } catch (err) {
      setMensaje(err.message);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Panel de Administración</h1>
        <div>
          <span>Hola, {auth.nombre}</span>
          <button onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      {mensaje && <p className="auth-error">{mensaje}</p>}

      <section className="panel">
        <h2>Accesos pendientes ({usuariosPendientes.length})</h2>
        {usuariosPendientes.length === 0 && <p>No hay solicitudes pendientes.</p>}
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Asignar rol</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuariosPendientes.map((u) => (
              <tr key={u.id}>
                <td>{u.nombre}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={rolSeleccionado[u.id] || 'pedido'}
                    onChange={(e) => setRolSeleccionado({ ...rolSeleccionado, [u.id]: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button onClick={() => darAcceso(u.id)}>Dar acceso</button>
                  <button className="btn-danger" onClick={() => negarAcceso(u.id)}>Negar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2>Vinilos pendientes de aprobación ({productosPendientes.length})</h2>
        {productosPendientes.length === 0 && <p>No hay vinilos pendientes.</p>}
        <div className="product-grid">
          {productosPendientes.map((p) => (
            <div className="product-card" key={p.id}>
              {p.imagenUrl && <img src={`${BASE_URL}${p.imagenUrl}`} alt={p.nombre} />}
              <h3>{p.nombre}</h3>
              <p>{p.artista}</p>
              <p>${p.precio}</p>
              <div className="product-actions">
                <button onClick={() => aprobarProducto(p.id)}>Aprobar</button>
                <button className="btn-danger" onClick={() => rechazarProducto(p.id)}>Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
