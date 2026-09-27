import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { Link } from 'react-router-dom';

const ROLES = ['admin', 'producto', 'pedido'];

export default function DashboardHome() {
  const { auth } = useAuth();
  const rol = auth?.rol;

  // Estados globales
  const [stats, setStats] = useState({
    usuarios: 0,
    usuariosPend: 0,
    productos: 0,
    productosPend: 0,
    productosAprob: 0,
    productosRech: 0,
    pedidos: 0,
    pedidosPend: 0,
  });

  // Admin
  const [usuariosActivos, setUsuariosActivos] = useState([]);
  const [usuariosPendientes, setUsuariosPendientes] = useState([]);
  const [productosPendientes, setProductosPendientes] = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState({});

  // Pedido
  const [recomendados, setRecomendados] = useState([]);
  const [misPedidos, setMisPedidos] = useState([]);

  const [mensaje, setMensaje] = useState('');

  const [ultimosVinilos, setUltimosVinilos] = useState([]);
const [ultimosPendientes, setUltimosPendientes] = useState([]);
const [detallePendiente, setDetallePendiente] = useState(null);

  // ============================================================
  // Cargar datos según rol
  // ============================================================
  const cargarDatos = async () => {
    try {
      if (rol === 'admin') {
        const [usuarios, usersPend, productos, prodPend, pedidos] = await Promise.all([
          api.listarUsuarios().catch(() => []),
          api.listarUsuariosPendientes().catch(() => []),
          api.listarProductos().catch(() => []),
          api.listarProductosPendientes().catch(() => []),
          api.listarPedidos().catch(() => []),
        ]);

        const arrU = Array.isArray(usuarios) ? usuarios : usuarios.usuarios || [];
        const arrUP = Array.isArray(usersPend) ? usersPend : usersPend.usuarios || [];
        const arrP = Array.isArray(productos) ? productos : productos.productos || [];
        const arrPP = Array.isArray(prodPend) ? prodPend : prodPend.productos || [];
        const arrPe = Array.isArray(pedidos) ? pedidos : pedidos.pedidos || [];

        setUsuariosActivos(arrU.filter((u) => u.estado === 'activo'));
        setUsuariosPendientes(arrUP);
        setProductosPendientes(arrPP);

        setStats({
          usuarios: arrU.length,
          usuariosPend: arrUP.length,
          productos: arrP.length,
          productosPend: arrPP.length,
          productosAprob: arrP.filter((p) => p.estado === 'aprobado').length,
          productosRech: arrP.filter((p) => p.estado === 'rechazado').length,
          pedidos: arrPe.length,
          pedidosPend: arrPe.filter((p) => p.estado === 'pendiente').length,
        });
      }
      else if (rol === 'producto') {
  const productos = await api.listarProductos().catch(() => []);
  const arr = Array.isArray(productos) ? productos : productos.productos || [];

  // Stats
  setStats((s) => ({
    ...s,
    productos: arr.length,
    productosPend: arr.filter((p) => p.estado === 'pendiente').length,
    productosAprob: arr.filter((p) => p.estado === 'aprobado').length,
    productosRech: arr.filter((p) => p.estado === 'rechazado').length,
  }));

  // Últimos 3 vinilos registrados (por id descendente)
  const ordenados = [...arr].sort((a, b) => b.id - a.id);
  setUltimosVinilos(ordenados.slice(0, 3));

  // Últimos 3 pendientes (por id descendente)
  const pendientes = ordenados.filter((p) => p.estado === 'pendiente');
  setUltimosPendientes(pendientes.slice(0, 3));
} 
      
      else if (rol === 'pedido') {
        const [recom, pedidos] = await Promise.all([
          api.listarProductosRecomendados().catch(() => []),
          api.listarPedidos().catch(() => []),
        ]);
        setRecomendados(Array.isArray(recom) ? recom : recom.productos || []);
        setMisPedidos(Array.isArray(pedidos) ? pedidos : pedidos.pedidos || []);
      }
    } catch (err) {
      setMensaje(err.message);
    }
  };

  useEffect(() => { cargarDatos(); }, [rol]);

  // ============================================================
  // Acciones admin
  // ============================================================
  const darAcceso = async (id) => {
    const rol = rolSeleccionado[id] || 'pedido';
    try {
      await api.aprobarUsuario(id, rol);
      cargarDatos();
    } catch (err) { setMensaje(err.message); }
  };

  const negarAcceso = async (id) => {
    try {
      await api.negarUsuario(id);
      cargarDatos();
    } catch (err) { setMensaje(err.message); }
  };

  const aprobarProducto = async (id) => {
    try { await api.aprobarProducto(id); cargarDatos(); }
    catch (err) { setMensaje(err.message); }
  };

  const rechazarProducto = async (id) => {
    try { await api.rechazarProducto(id); cargarDatos(); }
    catch (err) { setMensaje(err.message); }
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div>
      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h1>Bienvenido, {auth?.nombre}</h1>
          <p className="page-subtitle">Panel de control · rol <strong>{rol}</strong></p>
        </div>
      </div>

      {mensaje && <p className="auth-error">{mensaje}</p>}

      {/* ====================== ADMIN ====================== */}
      {rol === 'admin' && (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <StatCard label="Usuarios" value={stats.usuarios} />
            <StatCard label="Usuarios pendientes" value={stats.usuariosPend} />
            <StatCard label="Vinilos" value={stats.productos} />
            <StatCard label="Vinilos por aprobar" value={stats.productosPend} />
            <StatCard label="Pedidos" value={stats.pedidos} />
            <StatCard label="Pedidos pendientes" value={stats.pedidosPend} />
          </div>

          {/* Productos pendientes */}
          <section style={{ marginTop: 32 }}>
            <div className="page-header">
              <h2>Productos pendientes de aprobación</h2>
              <span className="crud-count">{productosPendientes.length} en espera</span>
            </div>
            {productosPendientes.length === 0 ? (
              <p className="empty-state">No hay productos pendientes.</p>
            ) : (
              <div className="product-grid">
                {productosPendientes.map((p) => (
                  <div className="product-card" key={p.id}>
                    {p.imagenUrl ? (
                      <img src={`${BASE_URL}${p.imagenUrl}`} alt={p.nombre} />
                    ) : (
                      <div className="no-image">♪</div>
                    )}
                    <h3>{p.nombre}</h3>
                    <p className="artist">{p.artista}</p>
                    <p className="price">${Number(p.precio).toFixed(2)}</p>
                    <p className="stock">Stock: {p.stock ?? 0}</p>
                    <div className="product-actions">
                      <button className="btn-aprobar" onClick={() => aprobarProducto(p.id)}>Aprobar</button>
                      <button className="btn-warn" onClick={() => rechazarProducto(p.id)}>Rechazar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Usuarios activos */}
          <section style={{ marginTop: 32 }}>
            <div className="page-header">
              <h2>Usuarios activos</h2>
              <span className="crud-count">{usuariosActivos.length} registrados</span>
            </div>
            {usuariosActivos.length === 0 ? (
              <p className="empty-state">No hay usuarios activos.</p>
            ) : (
              <div className="crud-table-wrap">
                <table className="crud-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosActivos.slice(0, 5).map((u) => (
                      <tr key={u.id}>
                        <td>{u.nombre}</td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`badge-estado ${u.rol === 'admin' ? 'aprobado' : u.rol === 'producto' ? 'pendiente' : 'vendido'}`}>
                            {u.rol || 'sin rol'}
                          </span>
                        </td>
                        <td><span className={`badge-estado ${u.estado}`}>{u.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Usuarios pendientes */}
          <section style={{ marginTop: 32 }}>
            <div className="page-header">
              <h2>Nuevos usuarios pendientes</h2>
              <span className="crud-count">{usuariosPendientes.length} solicitudes</span>
            </div>
            {usuariosPendientes.length === 0 ? (
              <p className="empty-state">No hay solicitudes pendientes.</p>
            ) : (
              <div className="crud-table-wrap">
                <table className="crud-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Fecha solicitud</th>
                      <th>Asignar rol</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosPendientes.map((u) => (
                      <tr key={u.id}>
                        <td>{u.nombre}</td>
                        <td>{u.email}</td>
                        <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('es-MX') : '—'}</td>
                        <td>
                          <select
                            value={rolSeleccionado[u.id] || 'pedido'}
                            onChange={(e) => setRolSeleccionado({ ...rolSeleccionado, [u.id]: e.target.value })}
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td className="crud-actions">
                          <button className="btn-aprobar" onClick={() => darAcceso(u.id)}>Dar acceso</button>
                          <button className="btn-eliminar" onClick={() => negarAcceso(u.id)}>Negar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

{/* ====================== PRODUCTO ====================== */}
{rol === 'producto' && (
  <>
    {/* Stats */}
    <div className="stats-grid">
      <StatCard label="Mis vinilos" value={stats.productos} />
      <StatCard label="Aprobados" value={stats.productosAprob} />
      <StatCard label="Pendientes" value={stats.productosPend} />
      <StatCard label="Rechazados" value={stats.productosRech} />
    </div>

    {/* Últimos 3 vinilos registrados */}
    <section style={{ marginTop: 32 }}>
      <div className="page-header">
        <h2>Últimos vinilos registrados</h2>
        <Link to="/dashboard/productos" className="btn-ver">Ver todos →</Link>
      </div>
      {ultimosVinilos.length === 0 ? (
        <p className="empty-state">
          Aún no has registrado vinilos. Ve a <strong>Mis Vinilos</strong> para empezar.
        </p>
      ) : (
        <div className="product-grid">
          {ultimosVinilos.map((p) => (
            <div className="product-card" key={p.id}>
              {p.imagenUrl ? (
                <img src={`${BASE_URL}${p.imagenUrl}`} alt={p.nombre} />
              ) : (
                <div className="no-image">♪</div>
              )}
              <h3>{p.nombre}</h3>
              <p className="artist">{p.artista}</p>
              <p className="price">${Number(p.precio).toFixed(2)}</p>
              <span className={`badge-estado ${p.estado}`}>{p.estado}</span>
            </div>
          ))}
        </div>
      )}
    </section>

    {/* Últimos 3 pendientes */}
    <section style={{ marginTop: 32 }}>
      <div className="page-header">
        <h2>Vinilos pendientes de aprobación</h2>
        <Link to="/dashboard/pendientes" className="btn-ver">Ver todos →</Link>
      </div>
      {ultimosPendientes.length === 0 ? (
        <p className="empty-state">No tienes vinilos pendientes. 🎉</p>
      ) : (
        <div className="product-grid">
          {ultimosPendientes.map((p) => (
            <div className="product-card" key={p.id}>
              {p.imagenUrl ? (
                <img src={`${BASE_URL}${p.imagenUrl}`} alt={p.nombre} />
              ) : (
                <div className="no-image">♪</div>
              )}
              <h3>{p.nombre}</h3>
              <p className="artist">{p.artista}</p>
              <p className="price">${Number(p.precio).toFixed(2)}</p>
              <p className="stock">Stock: {p.stock ?? 0}</p>
              <div className="product-actions">
                <button className="btn-ver" onClick={() => setDetallePendiente(p)}>Ver detalle</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>

    {/* Modal detalle del pendiente */}
    {detallePendiente && (
      <div className="modal-overlay" onClick={() => setDetallePendiente(null)}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{detallePendiente.nombre}</h2>
            <button type="button" className="modal-close" onClick={() => setDetallePendiente(null)}>×</button>
          </div>
          <div className="modal-body">
            {detallePendiente.imagenUrl && (
              <img
                src={`${BASE_URL}${detallePendiente.imagenUrl}`}
                alt={detallePendiente.nombre}
                style={{ width: '100%', maxHeight: 260, objectFit: 'contain', border: 'var(--border-thin)' }}
              />
            )}
            <p><strong>Artista:</strong> {detallePendiente.artista}</p>
            <p><strong>Precio:</strong> ${Number(detallePendiente.precio).toFixed(2)}</p>
            <p><strong>Stock:</strong> {detallePendiente.stock ?? 0}</p>
            <p><strong>Estado:</strong> <span className={`badge-estado ${detallePendiente.estado}`}>{detallePendiente.estado}</span></p>
            {detallePendiente.descripcion && (
              <p><strong>Descripción:</strong> {detallePendiente.descripcion}</p>
            )}
            <p style={{ fontStyle: 'italic', color: 'var(--brown)', fontSize: '.85rem' }}>
              Este vinilo está en espera de aprobación por un administrador.
            </p>
            <div className="modal-footer">
              <button type="button" onClick={() => setDetallePendiente(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
)}

      {/* ====================== PEDIDO ====================== */}
      {rol === 'pedido' && (
        <>
          <section style={{ marginTop: 16 }}>
            <div className="page-header">
              <h2>Recomendados para ti</h2>
              <span className="crud-count">{recomendados.length} álbumes</span>
            </div>
            {recomendados.length === 0 ? (
              <p className="empty-state">Aún no hay recomendaciones.</p>
            ) : (
              <div className="product-grid">
                {recomendados.map((p) => (
                  <div className="product-card" key={p.id}>
                    {p.imagenUrl ? (
                      <img src={`${BASE_URL}${p.imagenUrl}`} alt={p.nombre} />
                    ) : (
                      <div className="no-image">♪</div>
                    )}
                    <h3>{p.nombre}</h3>
                    <p className="artist">{p.artista}</p>
                    <p className="price">${Number(p.precio).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section style={{ marginTop: 32 }}>
            <div className="page-header">
              <h2>Mis pedidos</h2>
              <span className="crud-count">{misPedidos.length} pedidos</span>
            </div>
            {misPedidos.length === 0 ? (
              <p className="empty-state">No has hecho pedidos aún.</p>
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
                    {misPedidos.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.producto_nombre}{p.artista && ` — ${p.artista}`}</td>
                        <td>{p.cantidad}</td>
                        <td>${Number(p.total).toFixed(2)}</td>
                        <td><span className={`badge-estado ${p.estado}`}>{p.estado}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}