import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../../services/api';
import CrudTable from '../../components/CrudTable';
import FormModal from '../../components/FormModal';

export default function AdminProductos() {
const [modalCrearOpen, setModalCrearOpen] = useState(false);
const [formCrear, setFormCrear] = useState({
  nombre: '', artista: '', descripcion: '', precio: '', stock: 0,
});
const [imagenCrearFile, setImagenCrearFile] = useState(null);
const [imagenCrearPreview, setImagenCrearPreview] = useState(null);
  const [productos, setProductos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [editando, setEditando] = useState(null);
  const [imagenFile, setImagenFile] = useState(null);
const [imagenPreview, setImagenPreview] = useState(null);
  const [form, setForm] = useState({
    nombre: '', artista: '', descripcion: '', precio: '', stock: 0, estado: 'pendiente',
  });
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const cargar = async () => {
    try {
      const data = await api.listarProductos();
      setProductos(Array.isArray(data) ? data : data.productos || []);
    } catch (err) { setMensaje(err.message); }
  };
  useEffect(() => { cargar(); }, []);
const abrirEditar = (p) => {
  setEditando(p);
  setForm({
    nombre: p.nombre,
    artista: p.artista,
    descripcion: p.descripcion || '',
    precio: p.precio,
    stock: p.stock ?? 0,
    estado: p.estado,
  });
  setImagenFile(null);
  setImagenPreview(p.imagenUrl ? `${BASE_URL}${p.imagenUrl}` : null);
  setModalOpen(true);
};
const abrirCrear = () => {
  setFormCrear({ nombre: '', artista: '', descripcion: '', precio: '', stock: 0 });
  setImagenCrearFile(null);
  setImagenCrearPreview(null);
  setModalCrearOpen(true);
};

const guardarNuevo = async () => {
  try {
    const fd = new FormData();
    fd.append('nombre', formCrear.nombre);
    fd.append('artista', formCrear.artista);
    fd.append('descripcion', formCrear.descripcion || '');
    fd.append('precio', Number(formCrear.precio));
    fd.append('stock', Number(formCrear.stock));
    if (imagenCrearFile) fd.append('imagen', imagenCrearFile);

    await api.crearProducto(fd);
    setModalCrearOpen(false);
    setFormCrear({ nombre: '', artista: '', descripcion: '', precio: '', stock: 0 });
    setImagenCrearFile(null);
    setImagenCrearPreview(null);
    cargar();
  } catch (err) {
    setMensaje(err.message);
  }
};
const guardar = async () => {
  try {
    const fd = new FormData();
    fd.append('nombre', form.nombre);
    fd.append('artista', form.artista);
    fd.append('descripcion', form.descripcion || '');
    fd.append('precio', Number(form.precio));
    fd.append('stock', Number(form.stock));
    fd.append('estado', form.estado);
    if (imagenFile) {
      fd.append('imagen', imagenFile);
    }

    await api.actualizarProducto(editando.id, fd);
    setModalOpen(false);
    cargar();
  } catch (err) {
    setMensaje(err.message);
  }
};

  const aprobar = async (p) => { try { await api.aprobarProducto(p.id); cargar(); } catch (e) { setMensaje(e.message); } };
  const rechazar = async (p) => { try { await api.rechazarProducto(p.id); cargar(); } catch (e) { setMensaje(e.message); } };
  const eliminar = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try { await api.eliminarProducto(p.id); cargar(); } catch (e) { setMensaje(e.message); }
  };

  const filtrados = filtroEstado === 'todos'
    ? productos
    : productos.filter((p) => p.estado === filtroEstado);

  const columnas = [
    { key: 'id', label: 'ID', getSearchValue: (p) => p.id },
    {
      key: 'imagenUrl',
      label: 'Portada',
      render: (p) => p.imagenUrl
        ? <img src={`${BASE_URL}${p.imagenUrl}`} alt={p.nombre} className="crud-thumb" />
        : <div className="crud-thumb-placeholder">♪</div>,
    },
    { key: 'nombre', label: 'Título' },
    { key: 'artista', label: 'Artista' },
    {
      key: 'precio',
      label: 'Precio',
      render: (p) => <strong>${Number(p.precio).toFixed(2)}</strong>,
    },
    { key: 'stock', label: 'Stock' },
    
{ 
  key: 'creadorNombre', 
  label: 'Registrado por',
  render: (p) => p.creadorNombre 
    ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'var(--mustard)', color: 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', fontSize: '.72rem'
        }}>
          {p.creadorNombre.charAt(0).toUpperCase()}
        </div>
        <span style={{ fontSize: '.85rem' }}>{p.creadorNombre}</span>
      </div>
    )
    : <em style={{ color: 'var(--brown)' }}>—</em>,
},

    {
      key: 'estado',
      label: 'Estado',
      render: (p) => <span className={`badge-estado ${p.estado}`}>{p.estado}</span>,
    },
  ];

  return (
    <div>
  <div className="page-header">
  <h1>Productos</h1>
  <div className="page-actions">
    <select
      className="crud-filter"
      value={filtroEstado}
      onChange={(e) => setFiltroEstado(e.target.value)}
      style={{ marginRight: 8 }}
    >
      <option value="todos">Todos los estados</option>
      <option value="pendiente">Pendientes</option>
      <option value="aprobado">Aprobados</option>
      <option value="rechazado">Rechazados</option>
      <option value="vendido">Vendidos</option>
    </select>
    <button onClick={abrirCrear}>+ Nuevo</button>
  </div>
</div>


      {mensaje && <p className="auth-error">{mensaje}</p>}

      <CrudTable
        columns={columnas}
        rows={filtrados}
        searchPlaceholder="Buscar por título o artista..."
        emptyMessage="No hay productos registrados"
        actions={(p) => (
          <>
            <button className="btn-ver" onClick={() => setDetalle(p)}>Ver</button>
            {p.estado === 'pendiente' && (
              <>
                <button className="btn-aprobar" onClick={() => aprobar(p)}>Aprobar</button>
                <button className="btn-warn" onClick={() => rechazar(p)}>Rechazar</button>
              </>
            )}
            <button className="btn-editar" onClick={() => abrirEditar(p)}>Editar</button>
            <button className="btn-eliminar" onClick={() => eliminar(p)}>Eliminar</button>
          </>
        )}
      />

      {/* Modal editar */}
      <FormModal
        title={`Editar: ${editando?.nombre || ''}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={guardar}
        submitLabel="Guardar cambios"
      >
        <label>Portada (imagen)
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const f = e.target.files?.[0];
      if (f) {
        setImagenFile(f);
        setImagenPreview(URL.createObjectURL(f));
      }
    }}
  />
</label>

{imagenPreview && (
  <div style={{ textAlign: 'center', marginTop: 4 }}>
    <img
      src={imagenPreview}
      alt="preview"
      style={{
        maxWidth: '100%',
        maxHeight: 180,
        border: 'var(--border-thin)',
        objectFit: 'contain',
      }}
    />
  </div>
)}
        <label>Título
          <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
        </label>
        <label>Artista
          <input value={form.artista} onChange={(e) => setForm({ ...form, artista: e.target.value })} required />
        </label>
        <label>Descripción
          <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </label>
        <label>Precio
          <input type="number" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} required />
        </label>
        <label>Stock
          <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
        </label>
        <label>Estado
          <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
            <option value="pendiente">pendiente</option>
            <option value="aprobado">aprobado</option>
            <option value="rechazado">rechazado</option>
            <option value="vendido">vendido</option>
          </select>
        </label>
      </FormModal>
<FormModal
  title="Nuevo producto"
  open={modalCrearOpen}
  onClose={() => {
    setModalCrearOpen(false);
    setImagenCrearFile(null);
    setImagenCrearPreview(null);
  }}
  onSubmit={guardarNuevo}
  submitLabel="Crear producto"
>
  <label>Portada (imagen)
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) {
          setImagenCrearFile(f);
          setImagenCrearPreview(URL.createObjectURL(f));
        }
      }}
    />
  </label>

  {imagenCrearPreview && (
    <div style={{ textAlign: 'center', marginTop: 4 }}>
      <img
        src={imagenCrearPreview}
        alt="preview"
        style={{ maxWidth: '100%', maxHeight: 180, border: 'var(--border-thin)', objectFit: 'contain' }}
      />
    </div>
  )}

  <label>Título
    <input value={formCrear.nombre} onChange={(e) => setFormCrear({ ...formCrear, nombre: e.target.value })} required />
  </label>
  <label>Artista
    <input value={formCrear.artista} onChange={(e) => setFormCrear({ ...formCrear, artista: e.target.value })} required />
  </label>
  <label>Descripción
    <textarea value={formCrear.descripcion} onChange={(e) => setFormCrear({ ...formCrear, descripcion: e.target.value })} />
  </label>
  <label>Precio
    <input type="number" step="0.01" value={formCrear.precio} onChange={(e) => setFormCrear({ ...formCrear, precio: e.target.value })} required />
  </label>
  <label>Stock
    <input type="number" value={formCrear.stock} onChange={(e) => setFormCrear({ ...formCrear, stock: e.target.value })} />
  </label>
</FormModal>
 
{/* Modal detalle */}
{detalle && (
  <div className="modal-overlay" onClick={() => setDetalle(null)}>
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Detalle: {detalle.nombre}</h2>
        <button type="button" className="modal-close" onClick={() => setDetalle(null)}>×</button>
      </div>
      <div className="modal-body">
        {detalle.imagenUrl && (
          <img
            src={`${BASE_URL}${detalle.imagenUrl}`}
            alt={detalle.nombre}
            style={{ width: '100%', maxHeight: 260, objectFit: 'contain', border: 'var(--border-thin)' }}
          />
        )}
        <p><strong>Artista:</strong> {detalle.artista}</p>
        <p><strong>Precio:</strong> ${Number(detalle.precio).toFixed(2)}</p>
        <p><strong>Stock:</strong> {detalle.stock ?? 0}</p>
        {detalle.creadorNombre && (
  <>
    <hr style={{ border: 'none', borderTop: '2px dashed var(--brown)', margin: '8px 0' }} />
    <p>
      <strong>Registrado por:</strong>{' '}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, verticalAlign: 'middle' }}>
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--mustard)', color: 'var(--ink)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', fontSize: '.7rem'
        }}>
          {detalle.creadorNombre.charAt(0).toUpperCase()}
        </span>
        {detalle.creadorNombre}
      </span>
    </p>
    {detalle.creadorEmail && (
      <p><strong>Email del vendedor:</strong> {detalle.creadorEmail}</p>
    )}
  </>
)}
        <p><strong>Estado:</strong> <span className={`badge-estado ${detalle.estado}`}>{detalle.estado}</span></p>
        {detalle.descripcion && <p><strong>Descripción:</strong> {detalle.descripcion}</p>}

        <div className="modal-footer">
          <button type="button" onClick={() => setDetalle(null)}>Cerrar</button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}