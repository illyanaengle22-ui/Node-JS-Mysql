const Product = require('../domain/product');

class ProductService {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  // Producto se registra queda pendiente para aprobar por admin
  async registrarProducto({ nombre, artista, descripcion, precio, imagenUrl, stock, creadoPor }) {
    Product.validar({ nombre, artista, precio, stock });
    return this.productRepository.create({ nombre, artista, descripcion, precio, imagenUrl, stock, creadoPor });
  }

  async listarTodos() {
    return this.productRepository.findAll();
  }

  // Catálogo público 
  async listarActivos() {
    return this.productRepository.findActivos();
  }
  async recomendados() {
    return this.productRepository.findRandomAprobados(10);
  }

  // Bandeja del admin
  async listarPendientes() {
    return this.productRepository.findPendientes();
  }

  async listarPorCreador(creadoPor) {
    return this.productRepository.findByCreador(creadoPor);
  }

  async actualizarProducto(id, datos) {
    const actual = await this.productRepository.findById(id);
    if (!actual) throw new Error('Producto no encontrado');
    return this.productRepository.update(id, datos);
  }

 
  async aprobarProducto(id) {
    const actual = await this.productRepository.findById(id);
    if (!actual) throw new Error('Producto no encontrado');
    return this.productRepository.cambiarEstado(id, 'aprobado');
  }

  async rechazarProducto(id) {
    const actual = await this.productRepository.findById(id);
    if (!actual) throw new Error('Producto no encontrado');
    return this.productRepository.cambiarEstado(id, 'rechazado');
  }

  async eliminarProducto(id) {
    const eliminado = await this.productRepository.deleteById(id);
    if (!eliminado) throw new Error('Producto no encontrado');
    return true;
  }
}

module.exports = ProductService;
