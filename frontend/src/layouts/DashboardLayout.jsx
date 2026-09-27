import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function DashboardLayout() {
  return (
    <div className="dash-layout">
      <Sidebar />
      <Topbar />
      <main className="dash-content">
        <Outlet />
      </main>
    </div>
  );
}