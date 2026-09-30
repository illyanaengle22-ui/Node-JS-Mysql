const { validarCaptcha } = require('./captchaController');

class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  register = async (req, res) => {
    try {
      const { nombre, email, password, captchaId, captchaRespuesta } = req.body;

      if (!captchaId || !validarCaptcha(captchaId, captchaRespuesta)) {
        return res.status(400).json({ error: 'Captcha incorrecto o expirado' });
      }

      const usuario = await this.userService.registerUser({ nombre, email, password });
      res.status(201).json({
        mensaje: 'Registro exitoso. Un administrador debe aprobar tu acceso antes de iniciar sesión.',
        usuario,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  // Crear usuario desde el panel admin (sin captcha, con rol y estado activo)
  crearDesdeAdmin = async (req, res) => {
    try {
      const { nombre, email, password, rol } = req.body;
      const usuario = await this.userService.crearDesdeAdmin({
        nombre, email, password, rol,
      });
      res.status(201).json({
        mensaje: 'Usuario creado y activado',
        usuario,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  cambiarRol = async (req, res) => {
    try {
      const usuario = await this.userService.cambiarRol(req.params.id, req.body);
      res.json({ mensaje: 'Rol actualizado', usuario });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

login = async (req, res) => {
  const { email, password, captchaId, captchaRespuesta } = req.body;

  if (!captchaId || !validarCaptcha(captchaId, captchaRespuesta)) {
    return res.status(400).json({ msg: 'Captcha incorrecto o expirado' });
  }

  try {
    const { token, nombre, rol } = await this.userService.loginUser({ email, password });
    res.json({ msg: 'Login exitoso', token, nombre, rol });
  } catch (error) {
    if (error.codigo === 'PENDIENTE_APROBACION') {
      return res.status(403).json({ msg: error.message });
    }
    if (error.message === 'Credenciales inválidas') {
      return res.status(401).json({ msg: 'Credenciales incorrectas' });
    }
    console.error('ERROR REAL:', error);
    res.status(500).json({ msg: 'Error del servidor' });
  }
};
  list = async (req, res) => {
    try {
      res.json(await this.userService.listUsers());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // Usuarios pendientes (sin rol) para que el admin los apruebe
  listPendientes = async (req, res) => {
    try {
      res.json(await this.userService.listPendientes());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  // El admin da acceso y asigna rol
  aprobar = async (req, res) => {
    try {
      const { rol } = req.body;
      const usuario = await this.userService.aprobarUsuario(req.params.id, rol);
      res.json({ mensaje: 'Acceso otorgado', usuario });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  // El admin niega el acceso
  negar = async (req, res) => {
    try {
      await this.userService.negarUsuario(req.params.id);
      res.json({ mensaje: 'Acceso negado' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  update = async (req, res) => {
    try {
      const usuario = await this.userService.actualizarUsuario(req.params.id, req.body);
      res.json(usuario);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  updateByEmail = async (req, res) => {
    try {
      const { email, ...datos } = req.body;
      const usuario = await this.userService.actualizarPorEmail(email, datos);
      res.json(usuario);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  remove = async (req, res) => {
    try {
      await this.userService.eliminarUsuario(req.params.id);
      res.json({ mensaje: 'Usuario eliminado' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
}

module.exports = UserController;
