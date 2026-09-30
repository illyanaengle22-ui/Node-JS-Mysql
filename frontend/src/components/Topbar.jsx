import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const { auth, cerrarSesion } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <header className="dash-topbar">
      <h1>Tienda de vinilos</h1>
      <div className="user-info">
        <span>Hola, {auth?.nombre}</span>
        <span className="role-badge">{auth?.rol}</span>
        <button className="btn-ghost" onClick={salir}>Salir</button>
      </div>
    </header>
  );
}