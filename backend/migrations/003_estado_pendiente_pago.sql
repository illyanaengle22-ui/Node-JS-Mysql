BEGIN;

ALTER TABLE pedidos ALTER COLUMN estado SET DEFAULT 'pendiente_pago';

UPDATE pedidos SET estado = 'pendiente_pago' WHERE estado = 'pendiente';

COMMIT;
