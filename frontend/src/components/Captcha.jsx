import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { api } from '../services/api';

const Captcha = forwardRef(function Captcha({ respuesta, onRespuestaChange }, ref) {
  const [svg, setSvg] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [error, setError] = useState('');

  const cargarCaptcha = async () => {
    try {
      const data = await api.obtenerCaptcha();
      setSvg(data.svg);
      setCaptchaId(data.captchaId);
      setError('');
      // Limpiar el input al recargar
      onRespuestaChange(data.captchaId, '');
    } catch (e) {
      setError('No se pudo cargar el captcha');
    }
  };

  useEffect(() => {
    cargarCaptcha();
    // eslint-disable-next-line
  }, []);

  useImperativeHandle(ref, () => ({
    recargar: cargarCaptcha,
    captchaId,
  }));

  return (
    <div className="captcha-box">
      <label>Escribe los 10 caracteres que ves en la imagen</label>

      {svg ? (
        <div
          className="captcha-svg"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <p>{error || 'Cargando captcha...'}</p>
      )}

      <button
        type="button"
        className="captcha-refresh"
        onClick={cargarCaptcha}
      >
        ↻ Recargar imagen
      </button>

      <input
        type="text"
        placeholder="Código del captcha"
        value={respuesta}
        onChange={(e) => onRespuestaChange(captchaId, e.target.value)}
        required
        autoComplete="off"
        spellCheck={false}
        style={{ letterSpacing: '2px', fontSize: '1.05rem', textAlign: 'center' }}
      />
    </div>
  );
});

export default Captcha;