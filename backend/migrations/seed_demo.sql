-- =============================================================================
-- seed_demo.sql — Datos de demostración para el subsistema analítico
-- NO se ejecuta automáticamente en el despliegue. Correr a mano:
--   psql -h <host> -U <user> -d <db> -f backend/migrations/seed_demo.sql
--
-- Genera ~90 pedidos en los últimos 60 días con distintos productos,
-- usuarios y estados usando generate_series y random().
-- Respeta: stock >= 0, PKs/secuencias, FK constraints.
-- =============================================================================

BEGIN;

-- ─── 1. Usuarios de prueba ────────────────────────────────────────────────────
-- Contraseña de todos: "demo1234" (hash bcrypt)
INSERT INTO usuarios (nombre, email, password_hash, rol, estado, created_at)
VALUES
  ('Carlos Ruiz',      'carlos@demo.com',    '$2b$10$hp6JO3IVKLENOPqnRdsev.ru9gvTrpuMszd9IiTRoIgknr2kJdHuG', 'pedido',   'activo', NOW() - INTERVAL '70 days'),
  ('Laura Mendez',     'laura@demo.com',     '$2b$10$hp6JO3IVKLENOPqnRdsev.ru9gvTrpuMszd9IiTRoIgknr2kJdHuG', 'pedido',   'activo', NOW() - INTERVAL '65 days'),
  ('Miguel Torres',    'miguel@demo.com',    '$2b$10$hp6JO3IVKLENOPqnRdsev.ru9gvTrpuMszd9IiTRoIgknr2kJdHuG', 'pedido',   'activo', NOW() - INTERVAL '60 days'),
  ('Ana Flores',       'ana@demo.com',       '$2b$10$hp6JO3IVKLENOPqnRdsev.ru9gvTrpuMszd9IiTRoIgknr2kJdHuG', 'pedido',   'activo', NOW() - INTERVAL '55 days'),
  ('Roberto Salas',    'roberto@demo.com',   '$2b$10$hp6JO3IVKLENOPqnRdsev.ru9gvTrpuMszd9IiTRoIgknr2kJdHuG', 'pedido',   'activo', NOW() - INTERVAL '50 days'),
  ('Mariana Lopez',    'mariana@demo.com',   '$2b$10$hp6JO3IVKLENOPqnRdsev.ru9gvTrpuMszd9IiTRoIgknr2kJdHuG', 'producto', 'activo', NOW() - INTERVAL '70 days'),
  ('Fernando Diaz',    'fernando@demo.com',  '$2b$10$hp6JO3IVKLENOPqnRdsev.ru9gvTrpuMszd9IiTRoIgknr2kJdHuG', 'producto', 'activo', NOW() - INTERVAL '65 days')
ON CONFLICT (email) DO NOTHING;

-- ─── 2. Productos (vinilos) de prueba con stock y creadores ───────────────────
-- Vinilos de Mariana Lopez (incluye stock bajo <= 5 para demostración)
INSERT INTO productos (nombre, artista, descripcion, precio, stock, estado, creado_por, created_at)
SELECT
  nombre, artista, descripcion, precio, stock, 'aprobado',
  (SELECT id FROM usuarios WHERE email = 'mariana@demo.com' LIMIT 1),
  NOW() - INTERVAL '75 days'
FROM (VALUES
  ('Dark Side of the Moon',  'Pink Floyd',           'Clásico del rock progresivo',         450.00, 500),
  ('Thriller',               'Michael Jackson',      'El álbum más vendido de la historia',  380.00, 500),
  ('Abbey Road',             'The Beatles',          'Último álbum grabado por los Beatles', 420.00, 500),
  ('Rumours',                'Fleetwood Mac',        'Rock clásico de los 70s',              350.00, 4),
  ('Born to Run',            'Bruce Springsteen',    'Rock americano icónico',               320.00, 500),
  ('Purple Rain',            'Prince',               'Soundtrack legendario',                340.00, 500),
  ('Led Zeppelin IV',        'Led Zeppelin',         'Hard rock definitivo',                 390.00, 500),
  ('Nevermind',              'Nirvana',              'El álbum que definió el grunge',       310.00, 500),
  ('Back in Black',          'AC/DC',                'Hard rock de alto octanaje',           360.00, 500),
  ('Kind of Blue',           'Miles Davis',          'Jazz modal imprescindible',            280.00, 3)
) AS t(nombre, artista, descripcion, precio, stock)
ON CONFLICT DO NOTHING;

-- Vinilos de Fernando Diaz (segundo vendedor con sus propios vinilos y stock bajo)
INSERT INTO productos (nombre, artista, descripcion, precio, stock, estado, creado_por, created_at)
SELECT
  nombre, artista, descripcion, precio, stock, 'aprobado',
  (SELECT id FROM usuarios WHERE email = 'fernando@demo.com' LIMIT 1),
  NOW() - INTERVAL '60 days'
FROM (VALUES
  ('Random Access Memories', 'Daft Punk',            'Electrónica y funk moderno',           490.00, 250),
  ('The Wall',               'Pink Floyd',           'Ópera rock legendaria',                440.00, 300),
  ('A Night at the Opera',   'Queen',                'Incluye Bohemian Rhapsody',            410.00, 200),
  ('OK Computer',            'Radiohead',            'Hito del rock alternativo',            370.00, 2),
  ('Discovery',              'Daft Punk',            'House francés icónico',                390.00, 180)
) AS t(nombre, artista, descripcion, precio, stock)
ON CONFLICT DO NOTHING;

-- ─── 3. Pedidos demo distribuidos en los últimos 60 días ─────────────────────
-- Creamos una función temporal para generar datos aleatorios
DO $$
DECLARE
  v_usuario_ids   INT[];
  v_producto_ids  INT[];
  v_estados       TEXT[] := ARRAY['aprobado','aprobado','aprobado','aprobado',
                                   'rechazado','pendiente_pago','verificando_pago'];
  v_usuario_id    INT;
  v_producto_id   INT;
  v_cantidad      INT;
  v_precio        NUMERIC(10,2);
  v_estado        TEXT;
  v_dias_atras    INT;
  v_pedido_id     INT;
  i               INT;
  v_total         NUMERIC(10,2);
BEGIN
  -- Recoger IDs de usuarios demo con rol pedido
  SELECT ARRAY(
    SELECT id FROM usuarios
    WHERE email IN ('carlos@demo.com','laura@demo.com','miguel@demo.com',
                    'ana@demo.com','roberto@demo.com')
  ) INTO v_usuario_ids;

  -- Recoger IDs de todos los productos demo aprobados de ambos vendedores
  SELECT ARRAY(
    SELECT id FROM productos
    WHERE nombre IN (
      'Dark Side of the Moon','Thriller','Abbey Road','Rumours','Born to Run',
      'Purple Rain','Led Zeppelin IV','Nevermind','Back in Black','Kind of Blue',
      'Random Access Memories','The Wall','A Night at the Opera','OK Computer','Discovery'
    )
    AND estado = 'aprobado'
  ) INTO v_producto_ids;

  -- Si no hay IDs suficientes, salir sin error
  IF array_length(v_usuario_ids, 1) IS NULL OR array_length(v_producto_ids, 1) IS NULL THEN
    RAISE NOTICE 'No se encontraron usuarios o productos demo. Ejecuta el seed completo.';
    RETURN;
  END IF;

  -- Generar 90 pedidos
  FOR i IN 1..90 LOOP
    -- Selección aleatoria de usuario, producto, cantidad y estado
    v_usuario_id  := v_usuario_ids[1 + floor(random() * array_length(v_usuario_ids, 1))::INT];
    v_producto_id := v_producto_ids[1 + floor(random() * array_length(v_producto_ids, 1))::INT];
    v_cantidad    := 1 + floor(random() * 3)::INT;  -- 1 a 3 unidades
    v_estado      := v_estados[1 + floor(random() * array_length(v_estados, 1))::INT];
    v_dias_atras  := floor(random() * 60)::INT;     -- 0 a 59 días atrás

    -- Obtener precio del producto
    SELECT precio INTO v_precio FROM productos WHERE id = v_producto_id;
    v_total := v_precio * v_cantidad;

    -- Insertar pedido
    INSERT INTO pedidos (usuario_id, total, estado, created_at)
    VALUES (
      v_usuario_id,
      v_total,
      v_estado,
      NOW() - (v_dias_atras || ' days')::INTERVAL
        - (floor(random() * 23) || ' hours')::INTERVAL
        - (floor(random() * 59) || ' minutes')::INTERVAL
    )
    RETURNING id INTO v_pedido_id;

    -- Insertar item del pedido
    INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
    VALUES (v_pedido_id, v_producto_id, v_cantidad, v_precio);

    -- Nota: NO descontamos stock (el seed es solo para métricas analíticas)
    -- El stock se dejó en 500 unidades para absorber cualquier consulta sin romper CHECK
  END LOOP;

  RAISE NOTICE 'Seed completado: 90 pedidos demo insertados.';
END;
$$;

-- Actualizar secuencias por si acaso (previene conflictos de PK si se re-ejecuta)
SELECT setval('pedidos_id_seq',      (SELECT COALESCE(MAX(id), 1) FROM pedidos),      true);
SELECT setval('pedido_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM pedido_items), true);
SELECT setval('usuarios_id_seq',     (SELECT COALESCE(MAX(id), 1) FROM usuarios),     true);
SELECT setval('productos_id_seq',    (SELECT COALESCE(MAX(id), 1) FROM productos),    true);

COMMIT;

-- ─── Verificación rápida ──────────────────────────────────────────────────────
-- Ejecutar después del seed para confirmar los datos:
--
-- SELECT estado, COUNT(*) FROM pedidos GROUP BY estado ORDER BY estado;
-- SELECT pr.nombre, SUM(pi.cantidad) AS unidades
--   FROM pedido_items pi JOIN productos pr ON pr.id = pi.producto_id
--   GROUP BY pr.nombre ORDER BY unidades DESC LIMIT 5;
