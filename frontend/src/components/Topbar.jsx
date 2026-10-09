import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import CartSidebar from './CartSidebar';

export default function Topbar() {
  const { auth, cerrarSesion } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const salir = () => {
    cerrarSesion();
    navigate('/login');
  };

  return (
    <>
      <header className="dash-topbar">
        <h1>Tienda de vinilos</h1>
        <div className="user-info">
            {auth?.rol === 'pedido' && (
              <button className="cart-icon-btn" onClick={() => setIsCartOpen(true)}>
                <i className="fa-solid fa-cart-shopping"></i>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
            )}
          <span>Hola, {auth?.nombre}</span>
          <span className="role-badge">{auth?.rol}</span>
          <button className="btn-ghost" onClick={salir}>Salir</button>
        </div>
      </header>

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}