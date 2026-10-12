import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProductoReportes from '../components/reportes/ProductoReportes';

export default function DashboardProducto() {
  const { auth, cerrarSesion } = useAuth();
  const [misProductos, setMisProductos] = useState([]);
  const [form, setForm] = useState({ nombre: '', artista: '', descripcion: '', precio: '', stock: '' });
  const [imagen, setImagen] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const cargarProductos = async () => {
    try {
      const prods = await api.listarProductos();
      setMisProductos(Array.isArray(prods) ? prods : prods.productos || []);
    } catch (err) {
      setMensaje(err.message);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (imagen) formData.append('imagen', imagen);

      const data = await api.crearProducto(formData);
      setMensaje(data.mensaje || 'Vinilo registrado exitosamente.');
      setForm({ nombre: '', artista: '', descripcion: '', precio: '', stock: '' });
      setImagen(null);
      cargarProductos();
    } catch (err) {
      setMensaje(err.message);
    }
  };

  return (
    <div className="dashboard-page" style={{ padding: '24px 32px' }}>
      <header className="page-header">
        <div>
          <h1>Panel de Vendedor</h1>
          <p className="page-subtitle">Bienvenido, {auth?.nombre} · Gestión y métricas de tus vinilos</p>
        </div>
        {cerrarSesion && (
          <button className="btn-ghost" onClick={cerrarSesion}>
            <i className="fa-solid fa-right-from-bracket" /> Cerrar sesión
          </button>
        )}
      </header>

      {/* Métricas, Gráficas, Filtros y Stock Bajo */}
      <ProductoReportes />

      {/* Registrar nuevo vinilo */}
      <section className="chart-wrapper" style={{ marginTop: 32 }}>
        <h3 className="chart-titulo">
          <i className="fa-solid fa-plus-circle" /> Registrar nuevo vinilo
        </h3>
        <form className="crud-form" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <input name="nombre" placeholder="Título del vinilo" value={form.nombre} onChange={handleChange} required />
            <input name="artista" placeholder="Artista" value={form.artista} onChange={handleChange} required />
            <input name="precio" type="number" step="0.01" placeholder="Precio ($)" value={form.precio} onChange={handleChange} required />
            <input name="stock" type="number" placeholder="Stock disponible" value={form.stock} onChange={handleChange} />
          </div>
          <div style={{ marginTop: 16 }}>
            <textarea name="descripcion" placeholder="Descripción del álbum (opcional)" value={form.descripcion} onChange={handleChange} rows={3} style={{ width: '100%' }} />
          </div>
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--brown)' }}>
              Portada del álbum:
              <input type="file" accept="image/*" onChange={(e) => setImagen(e.target.files[0])} style={{ marginLeft: 8 }} />
            </label>
            <button type="submit" className="btn-aprobar">
              <i className="fa-solid fa-cloud-arrow-up" /> Registrar vinilo
            </button>
          </div>
        </form>
        {mensaje && <p className="auth-success" style={{ marginTop: 12 }}>{mensaje}</p>}
      </section>

      {/* Mis productos */}
      <section style={{ marginTop: 32 }}>
        <div className="page-header">
          <h2>Mis Vinilos en Catálogo</h2>
          <span className="crud-count">{misProductos.length} vinilos registrados</span>
        </div>
        {misProductos.length === 0 ? (
          <p className="empty-state">Aún no tienes vinilos registrados.</p>
        ) : (
          <div className="product-grid">
            {misProductos.map((p) => (
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
                <span className={`badge-estado ${p.estado}`}>{p.estado}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
