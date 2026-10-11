import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../../services/api';
import CrudTable from '../../components/CrudTable';
import FormModal from '../../components/FormModal';

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
      render: (p) => (p.createdAt ?? p.created_at) ? new Date(p.createdAt ?? p.created_at).toLocaleDateString('es-MX') : '—',
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
        <FormModal
          title={`Pedido #${detalle.id}`}
          open={true}
          onClose={() => setDetalle(null)}
          size="md"
          footer={
            <button type="button" onClick={() => setDetalle(null)}>Cerrar</button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Items */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--brown)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vinilos</h4>
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {detalle.items && detalle.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--paper-2)', paddingBottom: '8px' }}>
                    {item.imagen_url && (
                      <img src={`${BASE_URL}${item.imagen_url}`} alt={item.nombre} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.85rem' }}>{item.nombre}</p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--brown)' }}>{item.artista || '—'}</p>
                      <p style={{ margin: 0, fontSize: '0.82rem' }}>{item.cantidad} x ${Number(item.precio_unitario || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px', background: 'var(--paper)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--brown)', textTransform: 'uppercase' }}>Cliente</p>
                <p style={{ margin: '2px 0 0', fontWeight: 'bold', fontSize: '0.85rem' }}>{detalle.cliente_nombre || 'Usuario desconocido'}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--brown)', textTransform: 'uppercase' }}>Email</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>{detalle.cliente_email || '—'}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--brown)', textTransform: 'uppercase' }}>Fecha</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>{(detalle.createdAt ?? detalle.created_at) ? new Date(detalle.createdAt ?? detalle.created_at).toLocaleString('es-MX') : '—'}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--brown)', textTransform: 'uppercase' }}>Estado</p>
                <span className={`badge-estado ${detalle.estado}`} style={{ marginTop: '2px', display: 'inline-block' }}>{detalle.estado}</span>
              </div>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <p style={{ margin: 0, fontSize: '1rem' }}><strong>Total:</strong> <strong>${Number(detalle.total).toFixed(2)}</strong></p>
            </div>
          </div>
        </FormModal>
      )}
    </div>
  );
}