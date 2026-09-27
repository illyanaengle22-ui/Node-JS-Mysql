const { generarCaptcha } = require('../infrastructure/captchaAdapter');
const captchaStore = require('../infrastructure/captchaStore');

function obtenerCaptcha(req, res) {
  const { svg, texto } = generarCaptcha();
  const captchaId = captchaStore.guardar(texto);
  res.json({ captchaId, svg });
}


function validarCaptcha(captchaId, respuesta) {
  return captchaStore.validar(captchaId, respuesta);
}

module.exports = { obtenerCaptcha, validarCaptcha };
