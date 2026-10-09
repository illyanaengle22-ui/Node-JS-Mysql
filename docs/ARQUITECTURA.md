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
