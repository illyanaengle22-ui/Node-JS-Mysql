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
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_creado_por ON productos(creado_por);
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  total NUMERIC(10,2),
  estado VARCHAR(20) DEFAULT 'pendiente_pago',
  comprobante_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
-- Índices analíticos: aceleran las consultas del subsistema de reportes
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_created_at ON pedidos(estado, created_at);
CREATE TABLE IF NOT EXISTS pedido_items (
  id SERIAL PRIMARY KEY,
  pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INT DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL
);
-- Índice analítico en pedido_items: acelera top-productos
CREATE INDEX IF NOT EXISTS idx_pedido_items_producto_id ON pedido_items(producto_id);
-- Migrar la data existente (si es que la hay)
INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
SELECT
  p.id,
  p.producto_id,
  p.cantidad,
  (p.total / p.cantidad)
FROM pedidos p
WHERE p.producto_id IS NOT NULL;
-- Eliminar las columnas viejas de la tabla pedidos
ALTER TABLE pedidos
  DROP COLUMN IF EXISTS producto_id,
  DROP COLUMN IF EXISTS cantidad;
-- Índices de reportes adicionales
CREATE INDEX IF NOT EXISTS idx_productos_stock ON productos(stock);
CREATE INDEX IF NOT EXISTS idx_productos_precio ON productos(precio);
-- Establecer estado por defecto pendiente_pago
ALTER TABLE pedidos ALTER COLUMN estado SET DEFAULT 'pendiente_pago';
-- Actualizar registros existentes a pendiente_pago
UPDATE pedidos SET estado = 'pendiente_pago' WHERE estado = 'pendiente';
INSERT INTO usuarios (nombre, email, password_hash, rol, estado)
VALUES ('Admin Vinilos', 'admin@vinilos.com',
  '$2b$10$hp6JO3IVKLENOPqnRdsev.ru9gvTrpuMszd9IiTRoIgknr2kJdHuG',
  'admin', 'activo')
ON CONFLICT (email) DO NOTHING;
COMMIT;
