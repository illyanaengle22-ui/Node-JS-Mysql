import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import CrudTable from '../../components/CrudTable';
import FormModal from '../../components/FormModal';

const ROLES = ['admin', 'producto', 'pedido'];
const ESTADOS = ['activo', 'pendiente', 'rechazado'];

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [editando, setEditando] = useState(null);

  const [formCrear, setFormCrear] = useState({
    nombre: '', email: '', password: '', rol: 'pedido',
  });
  const [formEditar, setFormEditar] = useState({
    nombre: '', email: '', password: '', rol: 'pedido', estado: 'activo',
  });

  const cargar = async () => {
    try {
      const data = await api.listarUsuarios();
      setUsuarios(Array.isArray(data) ? data : data.usuarios || []);
    } catch (err) { setMensaje(err.message); }
  };
  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setFormCrear({ nombre: '', email: '', password: '', rol: 'pedido' });
    setModalCrearOpen(true);
  };

  const abrirEditar = (u) => {
    setEditando(u);
    setFormEditar({
      nombre: u.nombre,
      email: u.email,
      password: '',
      rol: u.rol || 'pedido',
      estado: u.estado || 'activo',
    });
    setModalEditarOpen(true);
  };

   const guardarNuevo = async () => {
    try {
      await api.crearUsuarioAdmin({
        nombre: formCrear.nombre,
        email: formCrear.email,
        password: formCrear.password,
        rol: formCrear.rol,
      });
      setModalCrearOpen(false);
      cargar();
    } catch (err) { setMensaje(err.message); }
  };

  const guardarEditar = async () => {
    try {
      // 1. Actualizar nombre/email/password
      const payload = { nombre: formEditar.nombre, email: formEditar.email };
      if (formEditar.password) payload.password = formEditar.password;
      await api.actualizarUsuario(editando.id, payload);

      // 2. Si cambió el rol o el estado, actualizarlo
      if (formEditar.rol !== editando.rol || formEditar.estado !== editando.estado) {
        await api.cambiarRolUsuario(editando.id, {
          rol: formEditar.rol,
          estado: formEditar.estado,
        });
      }

      setModalEditarOpen(false);
      cargar();
    } catch (err) { setMensaje(err.message); }
  };

  const eliminar = async (u) => {
    if (!confirm(`¿Eliminar a ${u.nombre}?`)) return;
    try { await api.eliminarUsuario(u.id); cargar(); }
    catch (err) { setMensaje(err.message); }
  };

  const columnas = [
    { key: 'id', label: 'ID' },
    {
      key: 'nombre',
      label: 'Nombre',
      render: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--mustard)', color: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '.8rem'
          }}>
            {u.nombre?.charAt(0).toUpperCase() || '?'}
          </div>
          <span>{u.nombre}</span>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'rol',
      label: 'Rol',
      render: (u) => u.rol
        ? <span className={`badge-estado ${u.rol === 'admin' ? 'aprobado' : u.rol === 'producto' ? 'pendiente' : 'vendido'}`}>{u.rol}</span>
        : <em style={{ color: 'var(--brown)' }}>sin rol</em>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (u) => <span className={`badge-estado ${u.estado}`}>{u.estado}</span>,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Usuarios</h1>
        <div className="page-actions">
          <button onClick={abrirCrear}>+ Nuevo</button>
        </div>
      </div>

      {mensaje && <p className="auth-error">{mensaje}</p>}

      <CrudTable
        columns={columnas}
        rows={usuarios}
        searchPlaceholder="Buscar por nombre o email..."
        emptyMessage="No hay usuarios registrados"
        actions={(u) => (
          <>
            <button className="btn-ver" onClick={() => setDetalle(u)}>Ver</button>
            <button className="btn-editar" onClick={() => abrirEditar(u)}>Editar</button>
            <button className="btn-eliminar" onClick={() => eliminar(u)}>Eliminar</button>
          </>
        )}
      />

      {/* Modal crear */}
      <FormModal
        title="Nuevo usuario"
        open={modalCrearOpen}
        onClose={() => setModalCrearOpen(false)}
        onSubmit={guardarNuevo}
        submitLabel="Crear usuario"
      >
        <label>Nombre
          <input value={formCrear.nombre} onChange={(e) => setFormCrear({ ...formCrear, nombre: e.target.value })} required />
        </label>
        <label>Email
          <input type="email" value={formCrear.email} onChange={(e) => setFormCrear({ ...formCrear, email: e.target.value })} required />
        </label>
        <label>Contraseña
          <input type="password" value={formCrear.password} onChange={(e) => setFormCrear({ ...formCrear, password: e.target.value })} required />
        </label>
        <label>Rol
          <select value={formCrear.rol} onChange={(e) => setFormCrear({ ...formCrear, rol: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      </FormModal>

      {/* Modal editar */}
      <FormModal
        title={`Editar: ${editando?.nombre || ''}`}
        open={modalEditarOpen}
        onClose={() => setModalEditarOpen(false)}
        onSubmit={guardarEditar}
        submitLabel="Guardar cambios"
      >
        <label>Nombre
          <input value={formEditar.nombre} onChange={(e) => setFormEditar({ ...formEditar, nombre: e.target.value })} required />
        </label>
        <label>Email
          <input type="email" value={formEditar.email} onChange={(e) => setFormEditar({ ...formEditar, email: e.target.value })} required />
        </label>
        <label>Contraseña <em>(dejar vacío para no cambiar)</em>
          <input type="password" value={formEditar.password} onChange={(e) => setFormEditar({ ...formEditar, password: e.target.value })} />
        </label>
        <label>Rol
          <select value={formEditar.rol} onChange={(e) => setFormEditar({ ...formEditar, rol: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label>Estado
          <select value={formEditar.estado} onChange={(e) => setFormEditar({ ...formEditar, estado: e.target.value })}>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
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
              <p><strong>ID:</strong> {detalle.id}</p>
              <p><strong>Nombre:</strong> {detalle.nombre}</p>
              <p><strong>Email:</strong> {detalle.email}</p>
              <p><strong>Rol:</strong> {detalle.rol || 'sin rol'}</p>
              <p><strong>Estado:</strong> <span className={`badge-estado ${detalle.estado}`}>{detalle.estado}</span></p>
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