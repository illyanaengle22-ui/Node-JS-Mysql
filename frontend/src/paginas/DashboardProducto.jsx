import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardProducto() {
  const { auth, cerrarSesion } = useAuth();
  const [misProductos, setMisProductos] = useState([]);
  const [form, setForm] = useState({ nombre: '', artista: '', descripcion: '', precio: '', stock: '' });
  const [imagen, setImagen] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const cargarProductos = async () => {
    try {
      setMisProductos(await api.listarProductos());
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
      setMensaje(data.mensaje);
      setForm({ nombre: '', artista: '', descripcion: '', precio: '', stock: '' });
      setImagen(null);
      cargarProductos();
    } catch (err) {
      setMensaje(err.message);
    }
  };

  const badgeEstado = (estado) => (
    <span className={`badge badge-${estado}`}>{estado}</span>
  );

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Mis vinilos en venta</h1>
        <div>
          <span>Hola, {auth.nombre}</span>
          <button onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </header>

      <section className="panel">
        <h2>Registrar nuevo vinilo</h2>
        <form className="product-form" onSubmit={handleSubmit}>
          <input name="nombre" placeholder="Título del vinilo" value={form.nombre} onChange={handleChange} required />
          <input name="artista" placeholder="Artista" value={form.artista} onChange={handleChange} required />
          <textarea name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} />
          <input name="precio" type="number" step="0.01" placeholder="Precio" value={form.precio} onChange={handleChange} required />
          <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} />
          <input type="file" accept="image/*" onChange={(e) => setImagen(e.target.files[0])} />
          <button type="submit">Registrar (queda pendiente de aprobación)</button>
        </form>
        {mensaje && <p className="auth-success">{mensaje}</p>}
      </section>

      <section className="panel">
        <h2>Mis productos</h2>
        <div className="product-grid">
          {misProductos.map((p) => (
            <div className="product-card" key={p.id}>
              {p.imagenUrl && <img src={`${BASE_URL}${p.imagenUrl}`} alt={p.nombre} />}
              <h3>{p.nombre}</h3>
              <p>{p.artista}</p>
              <p>${p.precio} · stock: {p.stock}</p>
              {badgeEstado(p.estado)}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
