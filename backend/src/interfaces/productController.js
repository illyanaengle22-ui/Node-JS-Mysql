const { rutaPublica } = require('../infrastructure/uploadAdapter');

class ProductController {
  constructor(productService) {
    this.productService = productService;
  }

  // producto registra imagen
  crear = async (req, res) => {
    try {
      const { nombre, artista, descripcion, precio, stock } = req.body;
      const imagenUrl = req.file ? rutaPublica(req.file.filename) : null;

      const producto = await this.productService.registrarProducto({
        nombre,
        artista,
        descripcion,
        precio,
        stock,
        imagenUrl,
        creadoPor: req.usuario.id,
      });

      res.status(201).json({
        mensaje: 'Producto registrado. Queda pendiente de aprobación por el administrador.',
        producto,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  
  listar = async (req, res) => {
    try {
      const { rol, id } = req.usuario;
      let productos;
      if (rol === 'admin') productos = await this.productService.listarTodos();
      else if (rol === 'pedido') productos = await this.productService.listarActivos();
      else productos = await this.productService.listarPorCreador(id);

      res.json(productos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  //productos esperando aprobación
  listarPendientes = async (req, res) => {
    try {
      res.json(await this.productService.listarPendientes());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  
  listarCatalogo = async (req, res) => {
    try {
      const productos = await this.productService.listarActivos();
      res.json(productos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  actualizar = async (req, res) => {
    try {
      const datos = { ...req.body };
      if (req.file) datos.imagenUrl = rutaPublica(req.file.filename);
      const producto = await this.productService.actualizarProducto(req.params.id, datos);
      res.json(producto);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  aprobar = async (req, res) => {
    try {
      const producto = await this.productService.aprobarProducto(req.params.id);
      res.json({ mensaje: 'Producto aprobado y visible en el catálogo', producto });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  rechazar = async (req, res) => {
    try {
      const producto = await this.productService.rechazarProducto(req.params.id);
      res.json({ mensaje: 'Producto rechazado', producto });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
  recomendados = async (req, res) => {
    try {
      const productos = await this.productService.recomendados();
      res.json(productos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  eliminar = async (req, res) => {
    try {
      await this.productService.eliminarProducto(req.params.id);
      res.json({ mensaje: 'Producto eliminado' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
}

module.exports = ProductController;
