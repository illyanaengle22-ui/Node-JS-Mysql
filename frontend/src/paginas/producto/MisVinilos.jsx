import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../../services/api';
import CrudTable from '../../components/CrudTable';
import FormModal from '../../components/FormModal';

export default function MisVinilos() {
  const [productos, setProductos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [editando, setEditando] = useState(null);

  const [formCrear, setFormCrear] = useState({
    nombre: '', artista: '', descripcion: '', precio: '', stock: 0,
  });
  const [imagenCrearFile, setImagenCrearFile] = useState(null);
  const [imagenCrearPreview, setImagenCrearPreview] = useState(null);

  const [formEditar, setFormEditar] = useState({
    nombre: '', artista: '', descripcion: '', precio: '', stock: 0, estado: 'pendiente',
  });
  const [imagenEditarFile, setImagenEditarFile] = useState(null);
  const [imagenEditarPreview, setImagenEditarPreview] = useState(null);

  const cargar = async () => {
    try {
      const data = await api.listarProductos();
      const arr = Array.isArray(data) ? data : data.productos || [];
      // El backend ya filtra por rol (rol producto ve los suyos)
      setProductos(arr);
    } catch (err) { setMensaje(err.message); }
  };
  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setFormCrear({ nombre: '', artista: '', descripcion: '', precio: '', stock: 0 });
    setImagenCrearFile(null);
    setImagenCrearPreview(null);
    setModalCrearOpen(true);
  };

  const abrirEditar = (p) => {
    setEditando(p);
    setFormEditar({
      nombre: p.nombre,
      artista: p.artista,
      descripcion: p.descripcion || '',
      precio: p.precio,
      stock: p.stock ?? 0,
      estado: p.estado,
    });
    setImagenEditarFile(null);
    setImagenEditarPreview(p.imagenUrl ? `${BASE_URL}${p.imagenUrl}` : null);
    setModalEditarOpen(true);
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
      cargar();
    } catch (err) { setMensaje(err.message); }
  };

  const guardarEditar = async () => {
    try {
      const fd = new FormData();
      fd.append('nombre', formEditar.nombre);
      fd.append('artista', formEditar.artista);
      fd.append('descripcion', formEditar.descripcion || '');
      fd.append('precio', Number(formEditar.precio));
      fd.append('stock', Number(formEditar.stock));
      if (imagenEditarFile) fd.append('imagen', imagenEditarFile);

      await api.actualizarProducto(editando.id, fd);
      setModalEditarOpen(false);
      cargar();
    } catch (err) { setMensaje(err.message); }
  };

  const eliminar = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    try { await api.eliminarProducto(p.id); cargar(); }
    catch (err) { setMensaje(err.message); }
  };

  const columnas = [
    { key: 'id', label: 'ID' },
    {
      key: 'imagenUrl',
      label: 'Portada',
      render: (p) => p.imagenUrl
        ? <img src={`${BASE_URL}${p.imagenUrl}`} alt={p.nombre} className="crud-thumb" />
        : <div className="crud-thumb-placeholder">♪</div>,
    },
    { key: 'nombre', label: 'Título' },
    { key: 'artista', label: 'Artista' },
    { key: 'precio', label: 'Precio', render: (p) => <strong>${Number(p.precio).toFixed(2)}</strong> },
    { key: 'stock', label: 'Stock' },
    { key: 'estado', label: 'Estado', render: (p) => <span className={`badge-estado ${p.estado}`}>{p.estado}</span> },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Mis vinilos</h1>
        <div className="page-actions">
          <button onClick={abrirCrear}>+ Nuevo</button>
        </div>
      </div>

      {mensaje && <p className="auth-error">{mensaje}</p>}

      <CrudTable
        columns={columnas}
        rows={productos}
        searchPlaceholder="Buscar por título o artista..."
        emptyMessage="Aún no has registrado vinilos"
        actions={(p) => (
          <>
            <button className="btn-ver" onClick={() => setDetalle(p)}>Ver</button>
            <button className="btn-editar" onClick={() => abrirEditar(p)}>Editar</button>
            <button className="btn-eliminar" onClick={() => eliminar(p)}>Eliminar</button>
          </>
        )}
      />

      {/* Modal crear */}
      <FormModal
        title="Nuevo vinilo"
        open={modalCrearOpen}
        onClose={() => { setModalCrearOpen(false); setImagenCrearFile(null); setImagenCrearPreview(null); }}
        onSubmit={guardarNuevo}
        submitLabel="Registrar vinilo"
      >
        <label>Portada
          <input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setImagenCrearFile(f); setImagenCrearPreview(URL.createObjectURL(f)); }
          }} />
        </label>
        {imagenCrearPreview && (
          <div style={{ textAlign: 'center' }}>
            <img src={imagenCrearPreview} alt="preview" style={{ maxWidth: '100%', maxHeight: 180, border: 'var(--border-thin)', objectFit: 'contain' }} />
          </div>
        )}
        <label>Título<input value={formCrear.nombre} onChange={(e) => setFormCrear({ ...formCrear, nombre: e.target.value })} required /></label>
        <label>Artista<input value={formCrear.artista} onChange={(e) => setFormCrear({ ...formCrear, artista: e.target.value })} required /></label>
        <label>Descripción<textarea value={formCrear.descripcion} onChange={(e) => setFormCrear({ ...formCrear, descripcion: e.target.value })} /></label>
        <label>Precio<input type="number" step="0.01" value={formCrear.precio} onChange={(e) => setFormCrear({ ...formCrear, precio: e.target.value })} required /></label>
        <label>Stock<input type="number" value={formCrear.stock} onChange={(e) => setFormCrear({ ...formCrear, stock: e.target.value })} /></label>
      </FormModal>

      {/* Modal editar */}
      <FormModal
        title={`Editar: ${editando?.nombre || ''}`}
        open={modalEditarOpen}
        onClose={() => { setModalEditarOpen(false); setImagenEditarFile(null); setImagenEditarPreview(null); }}
        onSubmit={guardarEditar}
        submitLabel="Guardar cambios"
      >
        <label>Portada
          <input type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) { setImagenEditarFile(f); setImagenEditarPreview(URL.createObjectURL(f)); }
          }} />
        </label>
        {imagenEditarPreview && (
          <div style={{ textAlign: 'center' }}>
            <img src={imagenEditarPreview} alt="preview" style={{ maxWidth: '100%', maxHeight: 180, border: 'var(--border-thin)', objectFit: 'contain' }} />
          </div>
        )}
        <label>Título<input value={formEditar.nombre} onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })} required /></label>
        <label>Artista<input value={formEditar.artista} onChange={(e) => setFormEditar({ ...formEditar, artista: e.target.value })} required /></label>
        <label>Descripción<textarea value={formEditar.descripcion} onChange={(e) => setFormEditar({ ...formEditar, descripcion: e.target.value })} /></label>
        <label>Precio<input type="number" step="0.01" value={formEditar.precio} onChange={(e) => setFormEditar({ ...formEditar, precio: e.target.value })} required /></label>
        <label>Stock<input type="number" value={formEditar.stock} onChange={(e) => setFormEditar({ ...formEditar, stock: e.target.value })} /></label>
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
              {detalle.imagenUrl && <img src={`${BASE_URL}${detalle.imagenUrl}`} alt={detalle.nombre} style={{ width: '100%', maxHeight: 260, objectFit: 'contain', border: 'var(--border-thin)' }} />}
              <p><strong>Artista:</strong> {detalle.artista}</p>
              <p><strong>Precio:</strong> ${Number(detalle.precio).toFixed(2)}</p>
              <p><strong>Stock:</strong> {detalle.stock ?? 0}</p>
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