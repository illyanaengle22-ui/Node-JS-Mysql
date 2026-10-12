# Especificación de Endpoints

Todos los endpoints (excepto los públicos) requieren el header:

```
Authorization: Bearer <JWT>
```

---

## Autenticación

| Método | Ruta | Rol | Body | Función |
|---|---|---|---|---|
| POST | `/usuarios` | público | `{ nombre, email, password, captchaId, captchaRespuesta }` | Registro (queda pendiente) |
| POST | `/login` | público | `{ email, password, captchaId, captchaRespuesta }` | Login → devuelve `{ token, nombre, rol }` |
| GET | `/captcha` | público | — | Devuelve `{ captchaId, svg }` |

---

## Usuarios

| Método | Ruta | Rol | Función |
|---|---|---|---|
| GET | `/usuarios` | admin | Lista todos los usuarios |
| GET | `/usuarios/pendientes` | admin | Lista usuarios pendientes de aprobación |
| PUT | `/usuarios/:id/aprobar` | admin | Aprueba usuario y asigna rol (`{ rol }`) |
| DELETE | `/usuarios/:id/negar` | admin | Niega acceso y elimina usuario pendiente |
| POST | `/usuarios/admin` | admin | Crea usuario ya activo con rol asignado |
| PUT | `/usuarios/:id` | auth | Actualiza nombre/email/password |
| PUT | `/usuarios/:id/rol` | admin | Cambia rol y estado |
| DELETE | `/usuarios/:id` | admin | Elimina usuario |

---

## Productos (vinilos)

| Método | Ruta | Rol | Función |
|---|---|---|---|
| GET | `/productos` | auth | Admin: todos. Producto: los suyos. Pedido: aprobados |
| GET | `/productos/catalogo` | auth | Todos los aprobados (visible a cualquier rol) |
| GET | `/productos/pendientes` | admin | Solo pendientes (con info del creador) |
| GET | `/productos/recomendados` | auth | 10 vinilos aleatorios aprobados |
| POST | `/productos` | producto, admin | Crea vinilo (multipart con `imagen`) |
| PUT | `/productos/:id` | producto, admin | Edita vinilo (multipart con `imagen` opcional) |
| PUT | `/productos/:id/aprobar` | admin | Cambia estado a aprobado |
| PUT | `/productos/:id/rechazar` | admin | Cambia estado a rechazado |
| DELETE | `/productos/:id` | producto, admin | Elimina vinilo |

**Nota:** los endpoints de creación y edición usan `multipart/form-data` para subir la imagen. La imagen se guarda en `backend/uploads/` y en la BD solo el path `/uploads/xxx`.

---

## Pedidos

| Método | Ruta | Rol | Función |
|---|---|---|---|
| POST | `/pedidos` | pedido | Crea pedido (`{ productoId, cantidad }`) |
| GET | `/pedidos` | admin, pedido | Admin: todos. Pedido: los propios |
| GET | `/pedidos/mis-solicitudes` | producto | Pedidos que otros hicieron sobre sus vinilos |
| PUT | `/pedidos/:id/aprobar` | admin | Aprueba pedido |
| PUT | `/pedidos/:id/rechazar` | admin | Rechaza pedido |
| DELETE | `/pedidos/:id` | admin | Elimina pedido |

---

## Archivos estáticos

| Método | Ruta | Función |
|---|---|---|
| GET | `/uploads/:filename` | Sirve las imágenes de productos |

---

## Códigos de respuesta

| Código | Significado |
|---|---|
| 200 | OK |
| 201 | Recurso creado |
| 400 | Error de validación o datos inválidos |
| 401 | No autenticado o credenciales incorrectas |
| 403 | No autorizado para el rol |
| 404 | Recurso no encontrado |
| 409 | Conflicto (email duplicado) |
| 500 | Error interno del servidor |

---

## Reportes Analíticos

> **Rol requerido:** `admin`  
> **Header:** `Authorization: Bearer <JWT>`  
> El prefijo `/api` lo agrega nginx; en el backend las rutas son `/reportes/...`

### Constantes del subsistema

| Constante | Valor | Descripción |
|---|---|---|
| `ESTADOS_VENTA` | `['aprobado']` | Solo estos estados se cuentan como venta real |
| Mapeo analítico | `pendiente_pago` → Pendiente, `verificando_pago` → Pendiente, `aprobado` → Pagado, `rechazado` → Cancelado | Categorías usadas en gráficas |

---

### GET /reportes/top-productos

**Parámetros query:**

| Parámetro | Tipo | Obligatorio | Valores | Default |
|---|---|---|---|---|
| `desde` | date (YYYY-MM-DD) | ✅ | — | — |
| `hasta` | date (YYYY-MM-DD) | ✅ | — | — |
| `limite` | integer | ❌ | 5, 10 | 5 |

**Ejemplo de petición:**
```
GET /api/reportes/top-productos?desde=2026-09-01&hasta=2026-10-10&limite=5
Authorization: Bearer <token-admin>
```

**Ejemplo de respuesta (200):**
```json
[
  {
    "productoId": 3,
    "nombre": "Abbey Road",
    "artista": "The Beatles",
    "unidadesVendidas": 24,
    "montoRecaudado": 10080.00,
    "numeroPedidos": 18
  }
]
```

**Errores:**

| Código | Mensaje |
|---|---|
| 400 | `"Se requieren los parámetros 'desde' y 'hasta'"` |
| 400 | `"Límite inválido. Valores permitidos: 5, 10"` |
| 400 | `'"desde" no puede ser posterior a "hasta"'` |
| 401 | `"Token no proporcionado"` |
| 403 | `"No tienes permisos para esta acción"` |

---

### GET /reportes/ingresos

**Parámetros query:**

| Parámetro | Tipo | Obligatorio | Valores | Default |
|---|---|---|---|---|
| `desde` | date | ✅ | — | — |
| `hasta` | date | ✅ | — | — |
| `agrupar` | string | ❌ | `dia`, `semana`, `mes` | `mes` |

**Ejemplo de petición:**
```
GET /api/reportes/ingresos?desde=2026-09-01&hasta=2026-10-10&agrupar=dia
Authorization: Bearer <token-admin>
```

**Ejemplo de respuesta (200):**
```json
[
  { "periodo": "2026-09-01T00:00:00.000Z", "ingresos": 1260.00, "pedidos": 3 },
  { "periodo": "2026-09-02T00:00:00.000Z", "ingresos": 840.50,  "pedidos": 2 }
]
```

**Errores:** igual que top-productos más `"Agrupación inválida. Valores permitidos: dia, semana, mes"`

---

### GET /reportes/estados

**Parámetros query:** `desde` y `hasta` (obligatorios)

**Ejemplo de petición:**
```
GET /api/reportes/estados?desde=2026-09-01&hasta=2026-10-10
Authorization: Bearer <token-admin>
```

**Ejemplo de respuesta (200):**
```json
[
  { "estadoReal": "aprobado",       "categoriaAnalitica": "Pagado",    "conteo": 45, "porcentaje": 60.00 },
  { "estadoReal": "pendiente_pago", "categoriaAnalitica": "Pendiente", "conteo": 20, "porcentaje": 26.67 },
  { "estadoReal": "rechazado",      "categoriaAnalitica": "Cancelado", "conteo": 10, "porcentaje": 13.33 }
]
```

---

### GET /reportes/ticket-promedio

**Parámetros query:** `desde` y `hasta` (obligatorios)

**Ejemplo de petición:**
```
GET /api/reportes/ticket-promedio?desde=2026-09-01&hasta=2026-10-10
Authorization: Bearer <token-admin>
```

**Ejemplo de respuesta (200):**
```json
{
  "ticketPromedioPedido":  420.00,
  "ticketPromedioUsuario": 1890.00,
  "totalPedidos":          45,
  "totalUsuarios":         24
}
```

---

### GET /reportes/resumen

**Parámetros query:** `desde` y `hasta` (obligatorios)

**Ejemplo de petición:**
```
GET /api/reportes/resumen?desde=2026-09-01&hasta=2026-10-10
Authorization: Bearer <token-admin>
```

**Ejemplo de respuesta (200):**
```json
{
  "ingresosTotal":   18900.00,
  "numeroPedidos":   45,
  "usuariosActivos": 24,
  "ticketPromedio":  420.00
}
```

---

## Reportes Analíticos — Mis Ventas (Rol: producto)

> **Rol requerido:** `producto`  
> **Header:** `Authorization: Bearer <JWT>`  
> **Seguridad:** El ID del vendedor se extrae **siempre** del token JWT (`req.user.id`). Cualquier intento de enviar IDs en query o body es ignorado.

| Método | Ruta | Query params | Descripción |
|---|---|---|---|
| GET | `/reportes/mis-ventas/resumen` | `desde`, `hasta` | Ingresos totales, unidades vendidas y número de pedidos sobre sus vinilos |
| GET | `/reportes/mis-ventas/ingresos` | `desde`, `hasta`, `agrupar` (`dia`\|`semana`\|`mes`) | Serie temporal de ingresos y pedidos de sus vinilos |
| GET | `/reportes/mis-ventas/top` | `desde`, `hasta`, `limite` (`5`\|`10`) | Top de sus propios vinilos más vendidos |
| GET | `/reportes/mis-ventas/stock-bajo` | — | Lista de sus vinilos con stock crítico (`stock <= 5`) |
| GET | `/reportes/mis-ventas/estados` | `desde`, `hasta` | Distribución por estado de pedidos que contienen sus vinilos |

### Ejemplo: GET /reportes/mis-ventas/resumen
```json
{
  "ingresosTotal": 5420.00,
  "unidadesVendidas": 14,
  "numeroPedidos": 9
}
```

### Ejemplo: GET /reportes/mis-ventas/stock-bajo
```json
[
  {
    "id": 4,
    "nombre": "Rumours",
    "artista": "Fleetwood Mac",
    "precio": 350.00,
    "stock": 4,
    "estado": "aprobado",
    "imagenUrl": null
  }
]
```

---

## Reportes Analíticos — Mis Compras (Rol: pedido)

> **Rol requerido:** `pedido`  
> **Header:** `Authorization: Bearer <JWT>`  
> **Seguridad:** El ID del comprador se extrae **siempre** del token JWT (`req.user.id`).

| Método | Ruta | Query params | Descripción |
|---|---|---|---|
| GET | `/reportes/mis-compras/resumen` | `desde`, `hasta` | Gasto total, número de pedidos y ticket promedio de sus compras aprobadas |
| GET | `/reportes/mis-compras/gasto` | `desde`, `hasta`, `agrupar` (`dia`\|`semana`\|`mes`) | Serie temporal de gasto por período |
| GET | `/reportes/mis-compras/estados` | `desde`, `hasta` | Conteo y porcentaje de sus pedidos por estado |
| GET | `/reportes/mis-compras/top` | `desde`, `hasta`, `limite` (`5`\|`10`) | Top de vinilos que más compra el usuario |

### Ejemplo: GET /reportes/mis-compras/resumen
```json
{
  "gastoTotal": 2450.00,
  "numeroPedidos": 6,
  "ticketPromedio": 408.33
}
```

### Ejemplo: GET /reportes/mis-compras/gasto
```json
[
  {
    "periodo": "2026-10-01T00:00:00.000Z",
    "ingresos": 1200.00,
    "pedidos": 3
  }
]
```
