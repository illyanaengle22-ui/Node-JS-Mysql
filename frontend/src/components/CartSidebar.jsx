import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';

export default function CartSidebar({ isOpen, onClose }) {
  const { cartItems, removeFromCart, cartTotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleCheckout = async () => {
    setIsProcessing(true);
    setMensaje('');
    setError('');

    try {
      const itemsPayload = cartItems.map(item => ({
        productoId: item.producto.id,
        cantidad: item.cantidad
      }));
      await api.crearPedido({ items: itemsPayload });
      setMensaje('¡Pedido confirmado con éxito!');
      clearCart();
      setTimeout(() => {
        setMensaje('');
        onClose();
      }, 3000);
    } catch (err) {
      setError(err.message || 'Hubo un error al procesar el pedido.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`cart-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Mi Carrito</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="cart-body">
          {mensaje && <p className="auth-success">{mensaje}</p>}
          {error && <p className="auth-error">{error}</p>}

          {cartItems.length === 0 ? (
            <p className="empty-cart">Tu carrito está vacío.</p>
          ) : (
            <ul className="cart-items">
              {cartItems.map((item) => (
                <li key={item.producto.id} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.producto.nombre}</h4>
                    <p>{item.producto.artista}</p>
                    <span className="cart-item-qty">
                      Cant: {item.cantidad} x ${item.producto.precio}
                    </span>
                  </div>
                  <button 
                    className="remove-btn" 
                    onClick={() => removeFromCart(item.producto.id)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total:</span>
            <strong>${cartTotal.toFixed(2)}</strong>
          </div>
          <button 
            className="btn-primary checkout-btn" 
            disabled={cartItems.length === 0 || isProcessing}
            onClick={handleCheckout}
          >
            {isProcessing ? 'Procesando...' : 'Confirmar Pedido'}
          </button>
        </div>
      </div>
    </>
  );
}
