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
      const { productoId, cantidad } = req.body;
      const pedido = await this.orderService.solicitarProducto({
        usuarioId: req.usuario.id,
        productoId,
        cantidad,
      });
      res.status(201).json({ mensaje: 'Pedido registrado', pedido });
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
