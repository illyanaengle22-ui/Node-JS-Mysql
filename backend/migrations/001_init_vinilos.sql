BEGIN;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS rol        VARCHAR(20),
  ADD COLUMN IF NOT EXISTS estado     VARCHAR(20) DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP   DEFAULT NOW();

UPDATE usuarios
   SET email = 'illyana.engle22@unach.com'
 WHERE email = 'illyana@gmail.com';

UPDATE usuarios
   SET rol = 'admin', estado = 'activo'
 WHERE email = 'illyana.engle22@unach.com';

UPDATE usuarios
   SET estado = 'pendiente'
 WHERE rol IS NULL;

CREATE TABLE IF NOT EXISTS productos (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL,
  artista      VARCHAR(150) NOT NULL,
  descripcion  TEXT,
  precio       NUMERIC(10,2) NOT NULL CHECK (precio > 0),
  imagen_url   VARCHAR(255),
  stock        INT DEFAULT 0 CHECK (stock >= 0),
  estado       VARCHAR(20) DEFAULT 'pendiente',
  creado_por   INT REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_productos_estado     ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_creado_por ON productos(creado_por);

CREATE TABLE IF NOT EXISTS pedidos (
  id           SERIAL PRIMARY KEY,
  usuario_id   INT REFERENCES usuarios(id)  ON DELETE CASCADE,
  producto_id  INT REFERENCES productos(id) ON DELETE CASCADE,
  cantidad     INT DEFAULT 1 CHECK (cantidad > 0),
  total        NUMERIC(10,2),
  estado       VARCHAR(20) DEFAULT 'pendiente',
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado  ON pedidos(estado);

INSERT INTO usuarios (nombre, email, password_hash, rol, estado)
VALUES (
  'Admin Vinilos',
  'admin@vinilos.com',
  '$2b$10$hp6JO3IVKLENOPqnRdsev.ru9gvTrpuMszd9IiTRoIgknr2kJdHuG',
  'admin',
  'activo'
)
ON CONFLICT (email) DO NOTHING;

COMMIT;
