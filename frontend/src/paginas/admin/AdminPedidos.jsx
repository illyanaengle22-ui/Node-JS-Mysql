import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../../services/api';
import CrudTable from '../../components/CrudTable';

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [detalle, setDetalle] = useState(null);

  const cargar = async () => {
    try {
      const data = await api.listarPedidos();
      setPedidos(Array.isArray(data) ? data : data.pedidos || []);
    } catch (err) { setMensaje(err.message); }
  };
  useEffect(() => { cargar(); }, []);

  const aprobar = async (p) => { try { await api.aprobarPedido(p.id); cargar(); } catch (e) { setMensaje(e.message); } };
  const rechazar = async (p) => { try { await api.rechazarPedido(p.id); cargar(); } catch (e) { setMensaje(e.message); } };
  const eliminar = async (p) => {
    if (!confirm(`¿Eliminar pedido #${p.id}?`)) return;
    try { await api.eliminarPedido(p.id); cargar(); } catch (e) { setMensaje(e.message); }
  };

  const columnas = [
    { key: 'id', label: '#' },
    {
      key: 'usuario_id',
      label: 'Cliente',
      render: (p) => p.usuario_nombre || `Usuario #${p.usuario_id}`,
    },
    {
      key: 'productos',
      label: 'Vinilos',
      render: (p) => (p.items && p.items.length > 0) ? `${p.items.length} vinilo(s)` : 'Ninguno',
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
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Pedidos</h1>
      </div>

      {mensaje && <p className="auth-error">{mensaje}</p>}

      <CrudTable
        columns={columnas}
        rows={pedidos}
        searchPlaceholder="Buscar por vinilo o estado..."
        emptyMessage="No hay pedidos registrados"
        actions={(p) => (
          <>
            <button className="btn-ver" onClick={() => setDetalle(p)}>Ver</button>
            {p.estado === 'pendiente' && (
              <>
                <button className="btn-aprobar" onClick={() => aprobar(p)}>Aprobar</button>
                <button className="btn-warn" onClick={() => rechazar(p)}>Rechazar</button>
              </>
            )}
            <button className="btn-eliminar" onClick={() => eliminar(p)}>Eliminar</button>
          </>
        )}
      />

      {/* Modal detalle */}
      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalle del pedido #{detalle.id}</h2>
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

              <hr style={{ border: 'none', borderTop: '2px dashed var(--ink)', margin: '12px 0' }} />

              <p><strong>Cliente:</strong> {detalle.usuario_nombre || `Usuario #${detalle.usuario_id}`}</p>
              <p><strong>Email:</strong> {detalle.usuario_email || '—'}</p>
              <p><strong>Fecha:</strong> {detalle.created_at ? new Date(detalle.created_at).toLocaleString('es-MX') : '—'}</p>
              <p><strong>Estado:</strong> <span className={`badge-estado ${detalle.estado}`}>{detalle.estado}</span></p>

              <div className="modal-footer">
                {detalle.estado === 'pendiente' && (
                  <>
                    <button className="btn-aprobar" onClick={() => { aprobar(detalle); setDetalle(null); }}>Aprobar</button>
                    <button className="btn-warn" onClick={() => { rechazar(detalle); setDetalle(null); }}>Rechazar</button>
                  </>
                )}
                <button type="button" onClick={() => setDetalle(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}