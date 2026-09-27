import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import Captcha from '../components/Captcha';

export default function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaRespuesta, setCaptchaRespuesta] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);
  const captchaRef = useRef(null);
  const navigate = useNavigate();

  const handleCaptchaChange = (id, valor) => {
    setCaptchaId(id);
    setCaptchaRespuesta(valor);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setCargando(true);
    try {
      const data = await api.registrar({ nombre, email, password, captchaId, captchaRespuesta });
      setExito(true);
      setMensaje(data.mensaje);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setMensaje(err.message);
      captchaRef.current?.recargar();
      setCaptchaRespuesta('');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Crear cuenta</h1>
        <p className="auth-subtitle">Tu cuenta quedará pendiente hasta que un administrador te dé acceso</p>

        <input
          type="text"
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña (min. 8, 1 mayúscula, 1 número)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Captcha ref={captchaRef} respuesta={captchaRespuesta} onRespuestaChange={handleCaptchaChange} />

        {mensaje && <p className={exito ? 'auth-success' : 'auth-error'}>{mensaje}</p>}

        <button type="submit" disabled={cargando}>
          {cargando ? 'Registrando...' : 'Registrarme'}
        </button>

        <p className="auth-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
