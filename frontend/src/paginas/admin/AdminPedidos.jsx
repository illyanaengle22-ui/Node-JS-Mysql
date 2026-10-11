import { useEffect, useState } from 'react';
import { api, BASE_URL } from '../../services/api';
import CrudTable from '../../components/CrudTable';
import FormModal from '../../components/FormModal';

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const verDetalle = async (p) => {
    setLoadingDetalle(true);
    try {
      const fresco = await api.obtenerPedido(p.id);
      if (typeof fresco.items === 'string') {
        fresco.items = JSON.parse(fresco.items);
      }
      setDetalle(fresco);
    } catch {
      const pClone = { ...p };
      if (typeof pClone.items === 'string') pClone.items = JSON.parse(pClone.items);
      setDetalle(pClone); // fallback al objeto en memoria
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cargar = async () => {
    try {
      const data = await api.listarPedidos();
      const arr = Array.isArray(data) ? data : data.pedidos || [];
      arr.forEach(p => {
        if (typeof p.items === 'string') {
          p.items = JSON.parse(p.items);
        }
      });
      setPedidos(arr);
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
      render: (p) => p.usuario_nombre || `Usuario #${p.usuarioId || p.usuario_id}`,
    },
    {
      key: 'productos',
      label: 'Vinilos',
      render: (p) => (p.items && p.items.length > 0) ? p.items.map(i => i.nombre).join(', ') : 'Ninguno',
    },
    {
      key: 'total',
      label: 'Total',
      render: (p) => <strong>${Number(p.total).toFixed(2)}</strong>,
    },
    {
      key: 'fecha',
      label: 'Fecha',
      render: (p) => (p.createdAt ?? p.created_at) ? new Date(p.createdAt ?? p.created_at).toLocaleString('es-MX') : '—',
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (p) => <span className={`badge-estado ${p.estado}`}>{p.estado === 'pendiente_pago' ? 'Pendiente de Pago' : p.estado === 'verificando_pago' ? 'Verificando Pago' : p.estado}</span>,
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
            <button className="btn-ver" onClick={() => verDetalle(p)}>Ver</button>
            {p.estado === 'verificando_pago' && (
              <>
                <button className="btn-aprobar" onClick={() => aprobar(p)}>Aprobar</button>
                <button className="btn-warn" onClick={() => rechazar(p)}>Rechazar</button>
              </>
            )}
            {p.estado === 'pendiente_pago' && (
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
        <FormModal
          title={`Pedido #${detalle.id}`}
          open={true}
          onClose={() => setDetalle(null)}
          size="md"
          footer={
            <>
              {detalle.estado === 'verificando_pago' && (
                <>
                  <button className="btn-aprobar" onClick={() => { aprobar(detalle); setDetalle(null); }}>Aprobar Pago</button>
                  <button className="btn-warn" onClick={() => { rechazar(detalle); setDetalle(null); }}>Rechazar</button>
                </>
              )}
              {detalle.estado === 'pendiente_pago' && (
                <button className="btn-warn" onClick={() => { rechazar(detalle); setDetalle(null); }}>Rechazar / Cancelar</button>
              )}
              <button type="button" onClick={() => setDetalle(null)}>Cerrar</button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Información General */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', background: 'var(--paper)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--brown)', textTransform: 'uppercase' }}>Cliente</p>
                <p style={{ margin: '2px 0 0', fontWeight: 'bold', fontSize: '0.85rem' }}>{detalle.usuario_nombre || `Usuario #${detalle.usuarioId || detalle.usuario_id}`}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--brown)', textTransform: 'uppercase' }}>Email</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>{detalle.usuario_email || '—'}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--brown)', textTransform: 'uppercase' }}>Fecha</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.85rem' }}>{new Date(detalle.createdAt ?? detalle.created_at).toLocaleString('es-MX')}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--brown)', textTransform: 'uppercase' }}>Estado</p>
                <span className={`badge-estado ${detalle.estado}`} style={{ marginTop: '2px', display: 'inline-block' }}>{detalle.estado === 'pendiente_pago' ? 'Pendiente de Pago' : detalle.estado === 'verificando_pago' ? 'Verificando Pago' : detalle.estado}</span>
              </div>
            </div>

            {/* Lista de Items */}
            <div>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.78rem', color: 'var(--brown)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Desglose de Vinilos</h4>
              <div className="modal-items-list" style={{ maxHeight: '200px' }}>
                {Array.isArray(detalle.items) && detalle.items.length > 0 ? detalle.items.map((item, idx) => (
                  <div key={idx} className="modal-item-card">
                    <div className="modal-item-left">
                      {item.imagenUrl ? (
                        <img src={`${BASE_URL}${item.imagenUrl}`} alt={item.nombre} className="modal-item-img" />
                      ) : (
                        <div className="modal-item-img-placeholder"><i className="fa-solid fa-record-vinyl"></i></div>
                      )}
                      <div className="modal-item-info">
                        <p className="modal-item-title">{item.nombre || 'Vinilo Desconocido'}</p>
                        <p className="modal-item-artist">{item.artista || 'Artista Desconocido'}</p>
                      </div>
                    </div>
                    <div className="modal-item-right">
                      <span className="modal-item-price">{item.cantidad} x ${Number(item.precioUnitario || 0).toFixed(2)}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--brown)', marginTop: '2px' }}>Subtotal: ${(item.cantidad * Number(item.precioUnitario || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                )) : (
                  <p style={{ color: 'var(--brown)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    {(typeof detalle.items === 'string' && detalle.items.length > 0)
                      ? 'Error al leer items (formato texto)'
                      : 'No hay items registrados en este pedido.'}
                  </p>
                )}
              </div>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
              <p style={{ margin: 0, fontSize: '1rem' }}><strong>Total:</strong> <strong style={{ color: 'var(--success)' }}>${Number(detalle.total).toFixed(2)}</strong></p>
            </div>

            {/* Comprobante */}
            {detalle.comprobante_url && (
              <div style={{ padding: '12px', border: '1px solid var(--border)', background: 'var(--paper-2)', borderRadius: '6px' }}>
                <p style={{ margin: '0 0 8px', color: 'var(--yellow)', fontWeight: 'bold', fontSize: '0.85rem' }}><i className="fa-solid fa-receipt"></i> Ficha de Depósito</p>
                <a href={`${BASE_URL}${detalle.comprobante_url}`} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center' }}>
                  <img src={`${BASE_URL}${detalle.comprobante_url}`} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid var(--brown)', objectFit: 'contain' }} />
                </a>
              </div>
            )}
          </div>
        </FormModal>
      )}
    </div>
  );
}