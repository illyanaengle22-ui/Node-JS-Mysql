import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../../services/api';
import CrudTable from '../../components/CrudTable';

export default function MisSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [detalle, setDetalle] = useState(null);

  const cargar = async () => {
    try {
      const data = await api.listarMisSolicitudes();
      setSolicitudes(Array.isArray(data) ? data : data.pedidos || []);
    } catch (err) { setMensaje(err.message); }
  };
  useEffect(() => { cargar(); }, []);

  const columnas = [
    { key: 'id', label: '#' },
    {
      key: 'producto_nombre',
      label: 'Vinilo',
      render: (p) => `${p.producto_nombre}${p.artista ? ` — ${p.artista}` : ''}`,
    },
    {
      key: 'cliente_nombre',
      label: 'Solicitante',
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--mustard)', color: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '.72rem'
          }}>
            {(p.cliente_nombre || '?').charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '.85rem' }}>{p.cliente_nombre || 'Usuario desconocido'}</span>
            <span style={{ fontSize: '.72rem', color: 'var(--brown)' }}>{p.cliente_email}</span>
          </div>
        </div>
      ),
    },
    { key: 'cantidad', label: 'Cantidad' },
    {
      key: 'total',
      label: 'Total',
      render: (p) => <strong>${Number(p.total).toFixed(2)}</strong>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (p) => <span className={`badge-estado ${p.estado}`}>{p.estado}</span>,
    },
    {
      key: 'created_at',
      label: 'Fecha',
      render: (p) => p.created_at ? new Date(p.created_at).toLocaleDateString('es-MX') : '—',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Solicitudes de mis vinilos</h1>
      </div>

      {mensaje && <p className="auth-error">{mensaje}</p>}

      <CrudTable
        columns={columnas}
        rows={solicitudes}
        searchPlaceholder="Buscar por vinilo o cliente..."
        emptyMessage="Nadie ha solicitado tus vinilos todavía"
        actions={(p) => (
          <button className="btn-ver" onClick={() => setDetalle(p)}>Ver</button>
        )}
      />

      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Pedido #{detalle.id}</h2>
              <button type="button" className="modal-close" onClick={() => setDetalle(null)}>×</button>
            </div>
            <div className="modal-body">
              {detalle.imagen_url && (
                <img
                  src={`${BASE_URL}${detalle.imagen_url}`}
                  alt={detalle.producto_nombre}
                  style={{ width: '100%', maxHeight: 220, objectFit: 'contain', border: 'var(--border-thin)' }}
                />
              )}
              <p><strong>Vinilo:</strong> {detalle.producto_nombre}</p>
              <p><strong>Artista:</strong> {detalle.artista}</p>
              <p><strong>Cantidad:</strong> {detalle.cantidad}</p>
              <p><strong>Precio unitario:</strong> ${Number(detalle.precio_unitario).toFixed(2)}</p>
              <p><strong>Total:</strong> <strong>${Number(detalle.total).toFixed(2)}</strong></p>
              <hr style={{ border: 'none', borderTop: '2px dashed var(--brown)', margin: '12px 0' }} />
              <p><strong>Cliente:</strong> {detalle.cliente_nombre || 'Usuario desconocido'}</p>
              <p><strong>Email:</strong> {detalle.cliente_email || '—'}</p>
              <p><strong>Fecha:</strong> {detalle.created_at ? new Date(detalle.created_at).toLocaleString('es-MX') : '—'}</p>
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