import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import DashboardHome from './DashboardHome';
import Catalogo from './Catalogo';
import MisSolicitudes from './producto/MisSolicitudes';

// Admin
import AdminUsuarios from './admin/AdminUsuarios';
import AdminProductos from './admin/AdminProductos';
import AdminPendientes from './admin/AdminPendientes';
import AdminPedidos from './admin/AdminPedidos';

// Pedido
import MisPedidos from './pedido/MisPedidos';

// Producto
import MisVinilos from './producto/MisVinilos';
import MisPendientes from './producto/MisPendientes';

export default function Dashboard() {
  const { auth } = useAuth();
  const rol = auth?.rol;

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="catalogo" element={<Catalogo />} />

        {rol === 'admin' && (
          <>
            <Route path="usuarios"   element={<AdminUsuarios />} />
            <Route path="productos"  element={<AdminProductos />} />
            <Route path="pendientes" element={<AdminPendientes />} />
            <Route path="pedidos"    element={<AdminPedidos />} />
          </>
        )}

        {rol === 'producto' && (
        <>
            <Route path="productos"    element={<MisVinilos />} />
            <Route path="pendientes"   element={<MisPendientes />} />
            <Route path="solicitudes"  element={<MisSolicitudes />} />
        </>
        )}

        {rol === 'pedido' && (
          <Route path="mis-pedidos" element={<MisPedidos />} />
        )}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}