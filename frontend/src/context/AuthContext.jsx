import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    const nombre = localStorage.getItem('nombre');
    return token ? { token, rol, nombre } : null;
  });

  const iniciarSesion = ({ token, rol, nombre }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('rol', rol);
    localStorage.setItem('nombre', nombre);
    setAuth({ token, rol, nombre });
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    localStorage.removeItem('nombre');
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
