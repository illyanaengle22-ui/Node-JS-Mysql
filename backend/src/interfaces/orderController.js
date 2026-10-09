class OrderController {
  constructor(orderService) {
    this.orderService = orderService;
  }

  _handleError = (res, err) => {
    const status = err.statusCode || err.status || 400;
    res.status(status).json({ error: err.message });
  };

  crear = async (req, res) => {
    try {
      const { items } = req.body;
      const pedido = await this.orderService.solicitarProducto({
        usuarioId: req.usuario.id,
        clienteInfo: { email: req.usuario.email, nombre: req.usuario.email.split('@')[0] }, // si req.usuario no tiene nombre, usamos parte del email
        items,
      });
      res.status(201).json({ mensaje: 'Pedido registrado', pedido });
    } catch (err) {
      this._handleError(res, err);
    }
  };

  subirComprobante = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Debes subir una imagen de comprobante' });
      }
      const { rutaPublica } = require('../infrastructure/uploadAdapter');
      const url = rutaPublica(req.file.filename);
      await this.orderService.subirComprobante(req.params.id, req.usuario.id, url);
      res.json({ mensaje: 'Comprobante subido exitosamente', comprobante_url: url });
    } catch (err) {
      this._handleError(res, err);
    }
  };

  listar = async (req, res) => {
    try {
      const { rol, id } = req.usuario;
      const pedidos = rol === 'admin'
        ? await this.orderService.listarTodos()
        : await this.orderService.listarPorUsuario(id);
      res.json(pedidos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  obtenerById = async (req, res) => {
    try {
      const pedido = await this.orderService.obtenerPorId(req.params.id);
      if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.json(pedido);
    } catch (err) {
      this._handleError(res, err);
    }
  };

  aprobar = async (req, res) => {
    try {
      await this.orderService.aprobarPedido(req.params.id);
      res.json({ mensaje: 'Pedido aprobado' });
    } catch (err) {
      this._handleError(res, err);
    }
  };

  misSolicitudes = async (req, res) => {
    try {
      const pedidos = await this.orderService.listarSolicitudesDeMisProductos(req.usuario.id);
      res.json(pedidos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  rechazar = async (req, res) => {
    try {
      await this.orderService.rechazarPedido(req.params.id);
      res.json({ mensaje: 'Pedido rechazado' });
    } catch (err) {
      this._handleError(res, err);
    }
  };

  eliminar = async (req, res) => {
    try {
      await this.orderService.eliminarPedido(req.params.id);
      res.json({ mensaje: 'Pedido eliminado' });
    } catch (err) {
      this._handleError(res, err);
    }
  };
}

module.exports = OrderController;
