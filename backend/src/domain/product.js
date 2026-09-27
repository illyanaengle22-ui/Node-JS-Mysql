class Product {
  constructor({ id, nombre, artista, descripcion, precio, imagenUrl, stock = 0, estado = 'pendiente', creadoPor }) {
    this.id = id;
    this.nombre = nombre;
    this.artista = artista;
    this.descripcion = descripcion;
    this.precio = precio;
    this.imagenUrl = imagenUrl;
    this.stock = stock;
    this.estado = estado;
    this.creadoPor = creadoPor;
  }

  static validar({ nombre, artista, precio, stock }) {
    if (!nombre || nombre.trim().length < 2) {
      throw new Error('El nombre del vinilo es obligatorio');
    }
    if (!artista || artista.trim().length < 2) {
      throw new Error('El artista es obligatorio');
    }
    const precioNum = Number(precio);
    if (Number.isNaN(precioNum) || precioNum <= 0) {
      throw new Error('El precio debe ser un número mayor a 0');
    }
    if (stock !== undefined && (Number.isNaN(Number(stock)) || Number(stock) < 0)) {
      throw new Error('El stock no puede ser negativo');
    }
    return true;
  }
}

module.exports = Product;
