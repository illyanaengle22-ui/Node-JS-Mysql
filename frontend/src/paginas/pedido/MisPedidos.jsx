import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function MisPedidos() {
    const [pedidos, setPedidos] = useState([]);
    const [mensaje, setMensaje] = useState('');

    const cargar = async () => {
        try {
            const data = await api.listarPedidos();
            const arr = Array.isArray(data) ? data : data.pedidos || [];
            // Parsear items si vienen como string
            arr.forEach(p => {
                if (typeof p.items === 'string') {
                    p.items = JSON.parse(p.items);
                }
            });
            setPedidos(arr);
        } catch (err) { setMensaje(err.message); }
    };
    useEffect(() => { cargar(); }, []);

    const handleUpload = async (id, file) => {
        if (!file) return;
        try {
            setMensaje('Subiendo comprobante...');
            await api.subirComprobante(id, file);
            setMensaje('¡Comprobante subido!');
            cargar();
        } catch (err) {
            setMensaje(err.message);
        }
    };

    return (
        <div>
            <h1>Mis pedidos</h1>
            {mensaje && <p className="auth-error">{mensaje}</p>}

            <section className="panel">
                <div className="panel-header"><h2>Historial ({pedidos.length})</h2></div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Vinilos</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Comprobante</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pedidos.map((p) => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>{(p.items || []).map(i => i.nombre).join(', ')}</td>
                                <td>{(p.items || []).reduce((acc, i) => acc + i.cantidad, 0)}</td>
                                <td>${p.total}</td>
                                <td>{(p.createdAt ?? p.created_at) ? new Date(p.createdAt ?? p.created_at).toLocaleDateString('es-MX') : '—'}</td>
                                <td><span className={`badge badge-${p.estado}`}>{p.estado === 'pendiente_pago' ? 'Pendiente de Pago' : p.estado === 'verificando_pago' ? 'Verificando Pago' : p.estado}</span></td>
                                <td>
                                    {p.comprobante_url ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <a href={`${api.BASE_URL || '/api'}${p.comprobante_url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--teal)', fontWeight: 'bold' }}>Ver Ficha</a>
                                            {(p.estado === 'verificando_pago' || p.estado === 'pendiente_pago') && (
                                                <label style={{ fontSize: '0.75rem', cursor: 'pointer', color: 'var(--accent)', textDecoration: 'underline' }}>
                                                    Re-subir
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        style={{ display: 'none' }}
                                                        onChange={(e) => handleUpload(p.id, e.target.files[0])}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    ) : p.estado === 'pendiente_pago' ? (
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleUpload(p.id, e.target.files[0])}
                                            style={{ fontSize: '0.75rem', maxWidth: '180px' }}
                                        />
                                    ) : (
                                        <span style={{ color: 'var(--brown)', fontStyle: 'italic' }}>N/A</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
}