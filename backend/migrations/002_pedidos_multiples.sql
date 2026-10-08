BEGIN;

CREATE TABLE IF NOT EXISTS pedido_items (
  id SERIAL PRIMARY KEY,
  pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id) ON DELETE CASCADE,
  cantidad INT DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL
);

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

COMMIT;
