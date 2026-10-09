BEGIN;
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20),
  estado VARCHAR(20) DEFAULT 'pendiente',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  artista VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2) NOT NULL CHECK (precio > 0),
  imagen_url VARCHAR(255),
  stock INT DEFAULT 0 CONSTRAINT stock_no_negativo CHECK (stock >= 0),
  estado VARCHAR(20) DEFAULT 'pendiente',
  creado_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  total NUMERIC(10,2),
  estado VARCHAR(20) DEFAULT 'pendiente_pago',
  comprobante_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS pedido_items (
  id SERIAL PRIMARY KEY,
  pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INT DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL
);
INSERT INTO usuarios (nombre, email, password_hash, rol, estado)
VALUES ('Admin Vinilos', 'admin@vinilos.com',
  '$2b$10$hp6JO3IVKLENOPqnRdsev.ru9gvTrpuMszd9IiTRoIgknr2kJdHuG',
  'admin', 'activo')
ON CONFLICT (email) DO NOTHING;
COMMIT;
