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
      key: 'vinilos',
      label: 'Vinilos',
      render: (p) => `${p.items?.length || 0} vinilo(s)`,
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
    {
      key: 'cantidad',
      label: 'Items',
      render: (p) => p.items?.reduce((acc, i) => acc + i.cantidad, 0) || 0,
    },
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
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                {detalle.items && detalle.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--paper-2)', paddingBottom: '10px', marginBottom: '10px' }}>
                    {item.imagen_url && (
                      <img src={`${BASE_URL}${item.imagen_url}`} alt={item.nombre} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold' }}>{item.nombre}</p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--brown)' }}>{item.artista || '—'}</p>
                      <p style={{ margin: 0, fontSize: '0.85rem' }}>{item.cantidad} x ${Number(item.precio_unitario || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p><strong>Total Pedido:</strong> <strong>${Number(detalle.total).toFixed(2)}</strong></p>
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