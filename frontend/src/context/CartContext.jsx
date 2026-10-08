import { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product, quantity) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.producto.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.producto.id === product.id
            ? { ...item, cantidad: item.cantidad + Number(quantity) }
            : item
        );
      }
      return [...prev, { producto: product, cantidad: Number(quantity) }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.producto.id !== productId));
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((sum, item) => {
    return sum + (Number(item.producto.precio) * item.cantidad);
  }, 0);

  const cartCount = cartItems.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
