import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Captcha from '../components/Captcha';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaRespuesta, setCaptchaRespuesta] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const captchaRef = useRef(null);
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();

  const handleCaptchaChange = (id, valor) => {
    setCaptchaId(id);
    setCaptchaRespuesta(valor);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setCargando(true);
    try {
      const data = await api.login({ email, password, captchaId, captchaRespuesta });
      iniciarSesion(data);
      navigate('/dashboard');
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
        <h1>Iniciar sesión</h1>
        <p className="auth-subtitle">TalkVinyl.</p>

        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Captcha ref={captchaRef} respuesta={captchaRespuesta} onRespuestaChange={handleCaptchaChange} />

        {mensaje && <p className="auth-error">{mensaje}</p>}

        <button type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Iniciar sesión'}
        </button>

        <p className="auth-link">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </form>
    </div>
  );
}
