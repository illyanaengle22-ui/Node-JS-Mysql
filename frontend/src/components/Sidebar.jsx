import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MENUS = {
  admin: [
    { to: '/dashboard',            label: 'Home',       fa: 'fa-house-tsunami', end: true },
    { to: '/dashboard/catalogo',   label: 'Catálogo',   fa: 'fa-compact-disc' },
    { to: '/dashboard/productos',  label: 'Productos',  fa: 'fa-record-vinyl' },
    { to: '/dashboard/pendientes', label: 'Pendientes', fa: 'fa-hourglass-half' },
    { to: '/dashboard/usuarios',   label: 'Usuarios',   fa: 'fa-users' },
    { to: '/dashboard/pedidos',    label: 'Pedidos',    fa: 'fa-box' },
  ],
    producto: [
    { to: '/dashboard',            label: 'Home',       fa: 'fa-house-tsunami', end: true },
    { to: '/dashboard/catalogo',    label: 'Catálogo',     fa: 'fa-compact-disc' },
    { to: '/dashboard/productos',   label: 'Mis Vinilos',  fa: 'fa-record-vinyl' },
    { to: '/dashboard/pendientes',  label: 'Pendientes',   fa: 'fa-hourglass-half' },
    { to: '/dashboard/solicitudes', label: 'Solicitudes',  fa: 'fa-receipt' },
    ],
  pedido: [
    { to: '/dashboard',          label: 'Home',     fa: 'fa-house-tsunami', end: true },
    { to: '/dashboard/catalogo', label: 'Catálogo', fa: 'fa-compact-disc' },
  ],
};

export default function Sidebar() {
  const { auth } = useAuth();
  const items = MENUS[auth?.rol] || [];

  return (
    <aside className="dash-sidebar">
      <div className="brand">
        <i className="fa-solid fa-record-vinyl"></i>TalkVinyl
      </div>
      <nav>
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <i className={`fa-solid ${it.fa} nav-icon`}></i>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}