import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function MisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const cargar = async () => {
    try {
      const data = await api.listarPedidos();
      setPedidos(Array.isArray(data) ? data : data.pedidos || []);
    } catch (err) { setMensaje(err.message); }
  };
  useEffect(() => { cargar(); }, []);

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
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{(p.items || []).map(i => i.nombre).join(', ')}</td>
                <td>{(p.items || []).reduce((acc, i) => acc + i.cantidad, 0)}</td>
                <td>${p.total}</td>
                <td><span className={`badge badge-${p.estado}`}>{p.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}