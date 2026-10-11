# Diagrama Arquitectónico — Arquitectura Hexagonal

El proyecto sigue el patrón **Hexagonal (Ports & Adapters)** 

---

## Diagrama de capas

```
                    ┌─────────────────────────────────────────────┐
                    │             INTERFACES                      │
                    │       (Adaptadores de entrada)              │
                    │                                             │
                    │  authMiddleware    soloRol                  │
                    │  userController    productController        │
                    │  orderController   captchaController        │
                    │                                             │
                    │  Express HTTP → recibe requests             │
                    └───────────────┬─────────────────────────────┘
                                    │  llaman a
                                    ▼
                    ┌─────────────────────────────────────────────┐
                    │            APPLICATION                      │
                    │        (Casos de uso / Servicios)           │
                    │                                             │
                    │  userService     productService             │
                    │  orderService    captchaStore               │
                    │                                             │
                    │  Orquestan el dominio + puertos             │
                    └───────────────┬─────────────────────────────┘
                                    │  usan entidades
                                    ▼
                    ┌─────────────────────────────────────────────┐
                    │              DOMAIN                         │
                    │      (Entidades + Puertos + Reglas)         │
                    │                                             │
                    │  User    Product    Order                   │
                    │                                             │
                    │  Puertos (interfaces):                      │
                    │  UserRepositoryPort  ProductRepositoryPort  │
                    │  OrderRepositoryPort NotificationPort       │
                    │                                             │
                    │  ⚠ No conoce nada externo                   │
                    │  (ni pg, ni express, ni bcrypt)             │
                    └───────────────▲─────────────────────────────┘
                                    │  implementan los puertos
                                    │
                    ┌───────────────┴─────────────────────────────┐
                    │          INFRASTRUCTURE                     │
                    │       (Adaptadores de salida)               │
                    │                                             │
                    │  db.js                     ← pool pg        │
                    │  userRepositoryAdapter                      │
                    │  productRepositoryAdapter                   │
                    │  orderRepositoryAdapter                     │
                    │  emailNotificationAdapter  ← nodemailer     │
                    │  captchaAdapter            ← svg-captcha    │
                    │  captchaStore              ← memoria        │
                    │  uploadAdapter             ← multer         │
                    │                                             │
                    │  bcrypt  →  usado directo en userService    │
                    └─────────────────────────────────────────────┘
```

---

## Estructura de carpetas del backend

```
backend/src/
├── server.js                            # Punto de entrada
├── .env                                 # Variables de entorno
│
├── domain/                              # Lógica
│   ├── user.js                          # Entidad Usuario
│   ├── product.js                       # Entidad Producto
│   ├── order.js                         # Entidad Pedido
│   ├── userRepositoryPort.js            # Contrato de persistencia
│   ├── productRepositoryPort.js         # Contrato de persistencia
│   ├── orderRepositoryPort.js           # Contrato de persistencia
│   └── notificationPort.js              # Contrato de notificaciones
│
├── application/                         # Casos de uso
│   ├── userService.js
│   ├── productService.js
│   └── orderService.js
│
├── infrastructure/                      # Adaptadores
│   ├── db.js                            # Pool de PostgreSQL
│   ├── userRepositoryAdapter.js
│   ├── productRepositoryAdapter.js
│   ├── orderRepositoryAdapter.js
│   ├── emailNotificationAdapter.js      # Nodemailer
│   ├── captchaAdapter.js                # Genera el SVG
│   ├── captchaStore.js                  # Guarda texto por ID
│   └── uploadAdapter.js                 # Configura multer
│
└── interfaces/                          # Entrada HTTP
    ├── authMiddleware.js                # Verifica JWT
    ├── roleMiddleware.js                # Verifica rol
    ├── userController.js
    ├── productController.js
    ├── orderController.js
    └── captchaController.js
```

---

## Reglas de la arquitectura

| Capa | Puede importar | NO puede importar |
|---|---|---|
| **domain** | Otros archivos de `domain/` | Nada externo |
| **application** | `domain/` | `infrastructure/`, `interfaces/`, Express, pg |
| **infrastructure** | `domain/` (implementa puertos) | `application/`, `interfaces/` |
| **interfaces** | `application/` | `infrastructure/` directamente |

---

## Verificación

Para confirmar que la regla se cumple:

```bash
# El dominio NO debe tener imports de librerías externas
grep -rn "require('pg')\|require('express')\|require('bcrypt')" backend/src/domain/
# (debe salir vacío)
```

---

## Flujo de una petición HTTP

Ejemplo: `POST /productos` con rol `producto`

```
1. Cliente envía POST /productos con imagen y JWT
        ↓
2. Express → authMiddleware (verifica JWT)
        ↓
3. authMiddleware → roleMiddleware('producto')  (verifica rol)
        ↓
4. uploadAdapter (multer) procesa la imagen
        ↓
5. productController.crear(req, res)  ← INTERFACES
        ↓
6. productService.registrarProducto({...})  ← APPLICATION
        ↓
7. new Product({...}).validar()  ← DOMAIN
        ↓
8. productRepository.create(product)  ← APPLICATION llama al puerto
        ↓
9. productRepositoryAdapter.create(product)  ← INFRASTRUCTURE
        ↓
10. INSERT INTO productos ...  ← PostgreSQL
        ↓
11. Respuesta 201 con el producto creado
```

---

## Subsistema Analítico

El módulo analítico es un **puerto de consultas independiente** que extrae métricas agregadas sin sobrecargar las entidades operativas (Usuario, Producto, Pedido).

### Principio de diseño

- **Desacoplamiento total**: `AnalyticsRepositoryPort` no extiende ningún puerto operativo.
- **Sin entidades de dominio operativas**: devuelve DTOs planos, no instancias de `User`, `Product` u `Order`.
- **Todo el cómputo en PostgreSQL**: SUM, COUNT, AVG, GROUP BY, date_trunc. Cero filas individuales en Node.
- **Seguridad SQL**: `date_trunc` se valida con lista blanca en `analyticsService.js` antes de interpolarse.

---

### Diagrama de flujo (Mermaid)

```mermaid
flowchart LR
    subgraph INTERFACES["interfaces/"]
        AC["analyticsController.js\nadaptador de entrada REST"]
    end
    subgraph APPLICATION["application/"]
        AS["analyticsService.js\nvalidacion · lista blanca · porcentajes"]
    end
    subgraph DOMAIN["domain/"]
        AP["analyticsRepositoryPort.js\ncontrato / puerto"]
    end
    subgraph INFRASTRUCTURE["infrastructure/"]
        AA["analyticsRepositoryAdapter.js\nSQL · SUM · COUNT · date_trunc"]
        DB[("PostgreSQL\npedidos · pedido_items\nproductos · usuarios")]
    end
    AC -->|llama a| AS
    AS -->|usa puerto| AP
    AP -.->|implementado por| AA
    AA -->|query| DB
```

---

### Independencia respecto a entidades operativas

```
analyticsService.js        NO importa User, Product, Order
analyticsController.js     NO importa orderService, productService, userService
analyticsRepositoryPort.js contrato nuevo e independiente
```

---

### Nuevos archivos del subsistema

| Capa | Archivo | Rol |
|---|---|---|
| domain | `analyticsRepositoryPort.js` | Contrato con 5 metodos de consulta |
| application | `analyticsService.js` | Validacion, lista blanca, calculo de porcentajes |
| infrastructure | `analyticsRepositoryAdapter.js` | 5 consultas SQL (SUM, COUNT, AVG, date_trunc) |
| interfaces | `analyticsController.js` | 5 endpoints GET /reportes/..., solo admin |

### Endpoints

| Ruta backend | Ruta nginx/frontend |
|---|---|
| GET /reportes/top-productos | GET /api/reportes/top-productos |
| GET /reportes/ingresos | GET /api/reportes/ingresos |
| GET /reportes/estados | GET /api/reportes/estados |
| GET /reportes/ticket-promedio | GET /api/reportes/ticket-promedio |
| GET /reportes/resumen | GET /api/reportes/resumen |

### Indices analiticos en 000_init_completo.sql

```sql
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at         ON pedidos(created_at);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_created_at  ON pedidos(estado, created_at);
CREATE INDEX IF NOT EXISTS idx_pedido_items_producto_id   ON pedido_items(producto_id);
```

### Mapeo de estados analiticos

| Estado real (BD) | Categoria analitica |
|---|---|
| pendiente_pago | Pendiente |
| verificando_pago | Pendiente |
| aprobado | Pagado |
| rechazado | Cancelado |

ESTADOS_VENTA = ['aprobado'] -- solo estos pedidos cuentan como ingreso real.

### Componentes frontend

| Archivo | Descripcion |
|---|---|
| paginas/admin/AdminReportes.jsx | Vista principal; Promise.allSettled sobre 5 endpoints |
| components/reportes/FiltroFechas.jsx | Presets + rango personalizado + selectores |
| components/reportes/GraficoIngresos.jsx | ComposedChart barras+linea (Recharts) |
| components/reportes/GraficoEstados.jsx | PieChart con colores semanticos |
| components/reportes/TablaTopProductos.jsx | Ranking con medallas y barras de progreso |
