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
