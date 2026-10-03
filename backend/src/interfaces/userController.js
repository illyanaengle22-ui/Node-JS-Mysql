class UserController {
  constructor(userService) {
    this.userService = userService;
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
    this.updateByEmail = this.updateByEmail.bind(this);
  }

  async register(req, res) {
    const { nombre, email, password } = req.body;

    try {
      await this.userService.registerUser({ nombre, email, password });
      res.status(201).json({ msg: "Usuario registrado" });
    } catch (error) {
      if (error.code === "VALIDATION_ERROR") {
        return res.status(400).json({ msg: error.message });
      }
      if (error.code === "23505" || error.code === "DUPLICATE_EMAIL") {
        return res.status(409).json({ msg: "El correo ya existe" });
      }
      res.status(500).json({ msg: "Error del servidor" });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;

    try {
      const { token, nombre } = await this.userService.loginUser({ email, password });
      res.json({ msg: "Login exitoso", token, nombre });
    } catch (error) {
      if (error.code === "INVALID_CREDENTIALS") {
        return res.status(401).json({ msg: "Credenciales incorrectas" });
      }
      res.status(500).json({ msg: "Error del servidor" });
    }
  }
 async list(req,res) {
   try {
	const usuarios = await this.userService.listUsers();
	res.json({msg:"API funcionando",usuarios});
   }
   catch (error) {
	res.status(500).json({msg:"Error al consultar los datos"});
   }
 }
 async update(req, res) {
    const { id } = req.params;
    const { nombre, email, password } = req.body;

    try {
      await this.userService.actualizarUsuario(id, { nombre, email, password });
      res.json({ msg: "Usuario actualizado correctamente" });
    } catch (error) {
      if (error.code === "VALIDATION_ERROR") {
        return res.status(400).json({ msg: error.message });
      }
      if (error.code == "NOT_FOUND"){
	return res.status(404).json({msg: error.message });
      }
      console.error("ERROR REAL:", error);
      res.status(500).json({ msg: "Error del servidor" });
    }
  }
 async remove(req, res) {
    const { id } = req.params;

    try {
      await this.userService.eliminarUsuario(id);
      res.json({ msg: "Usuario eliminado correctamente" });
    } catch (error) {
      if (error.code === "NOT_FOUND") {
        return res.status(404).json({ msg: error.message });
      }
      console.error("ERROR REAL:", error);
      res.status(500).json({ msg: "Error del servidor" });
    }
  }
  async updateByEmail(req, res) {
    const { email, nombre, password } = req.body;

    try {
      await this.userService.actualizarPorEmail(email, { nombre, password });
      res.json({ msg: "Usuario actualizado correctamente" });
    } catch (error) {
      if (error.code === "VALIDATION_ERROR") {
        return res.status(400).json({ msg: error.message });
      }
      if (error.code === "NOT_FOUND") {
        return res.status(404).json({ msg: error.message });
      }
      console.error("ERROR REAL:", error);
      res.status(500).json({ msg: "Error del servidor" });
    }
  }
}

module.exports = UserController;
