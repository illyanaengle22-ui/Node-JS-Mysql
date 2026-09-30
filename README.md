#TalkVINYL — E-Commerce de Vinilos

Proyecto de comercio electrónico para venta de vinilos de música, desarrollado con **Node.js + Express + PostgreSQL** en el backend (Arquitectura Hexagonal) y **React + Vite** en el frontend.

---

## Descripción

Sistema con 3 roles diferenciados:

- **Admin:** gestiona usuarios, productos y pedidos. Aprueba registros.
- **Producto (vendedor):** registra vinilos, ve solicitudes de sus productos.
- **Pedido (cliente):** consulta catálogo y realiza pedidos.

Cada usuario nuevo debe ser aprobado por un administrador antes de poder acceder.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js, Express, PostgreSQL, JWT, bcryptjs, multer, svg-captcha |
| Frontend | React 19, Vite, React Router, Font Awesome |
| Base de datos | PostgreSQL 18 |
| Entorno | WSL (Ubuntu) |

---

##Requisitos previos

- **WSL (Ubuntu)** instalado y funcionando
- **Node.js 20+** y **npm**
- **PostgreSQL 14+** corriendo en WSL
- **Git**

Verificar:

```bash
node --version    # v20.x o superior
npm --version
psql --version
```

---

## Guía de despliegue en WSL

### 1. Clonar el repositorio

```bash
cd ~
git clone https://github.com/illyanaengle22-ui/Node-JS-Mysql.git webapp
cd webapp
git checkout Arquitectura-Hexagonal
```

### 2. Configurar la base de datos

```bash
# Entrar a psql como postgres
sudo -u postgres psql

# Dentro de psql:
CREATE DATABASE practica_api;
\q
```

Ejecutar la migración (crea las 3 tablas):

```bash
sudo -u postgres psql -d practica_api -f backend/migrations/001_init_vinilos.sql
```

Verificar:

```bash
sudo -u postgres psql -d practica_api -c "\dt"
```

Debe mostrar `usuarios`, `productos`, `pedidos`.

### 3. Configurar el backend

```bash
cd backend
npm install
```

Crear el archivo `.env` dentro de `backend/src/`:

```bash
nano src/.env
```

Con este contenido (ajusta tu contraseña):

```env
PORT=3000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=mango7777
DB_NAME=practica_api
DB_PORT=5432
JWT_SECRET=cualquier_cadena_secreta
```

Levantar el backend:

```bash
node src/server.js
```

Debe imprimir: `Servidor escuchando en http://localhost:3000`

### 4. Configurar el frontend (otra terminal)

```bash
cd ~/webapp/frontend
npm install
npm run dev
```

Debe imprimir: `Local: http://localhost:5173/`

Abrir en el navegador: **http://localhost:5173**

---

## Credenciales de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@vinilos.com` | `Admin123!` |
| Admin (personal) | `illyana.engle22@unach.mx` | `1234` |
| Otros | Regístralos desde `/registro` y apruébalos desde el panel de admin |

---

## 📁 Estructura del proyecto

```
webapp/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── domain/           # Entidades y puertos
│   │   ├── application/      # Servicios (casos de uso)
│   │   ├── infrastructure/   # Adaptadores (pg, bcrypt, multer)
│   │   └── interfaces/       # Controllers HTTP + middlewares
│   ├── migrations/           # Scripts SQL
│   ├── uploads/              # Imágenes de vinilos
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── context/          # AuthContext
│   │   ├── layouts/          # DashboardLayout
│   │   ├── paginas/          # Vistas (admin, producto, pedido)
│   │   ├── services/         # api.js (fetch centralizado)
│   │   └── App.jsx
│   ├── public/
│   └── package.json
├── docs/
│   ├── ARQUITECTURA.md
│   ├── ENDPOINTS.md
│   └── overleaf/main.tex
└── README.md
```

---

## Roles y permisos

| Pestaña | Admin | Producto | Pedido |
|---|---|---|---|
| Home | ✅ stats globales | ✅ stats propias | ✅ recomendados |
| Catálogo | ✅ | ✅ | ✅ (solicitar) |
| Productos | ✅ CRUD todos | ✅ CRUD propios | ❌ |
| Pendientes | ✅ aprobar/rechazar | ✅ solo ver | ❌ |
| Solicitudes | ❌ | ✅ ver quién pidió | ❌ |
| Usuarios | ✅ CRUD | ❌ | ❌ |
| Pedidos | ✅ CRUD | ❌ | ✅ propios |

---

## Flujo de prueba completo

1. **Registrarse** en `/registro` con cualquier email
2. **Login como admin** (`admin@vinilos.com` / `Admin123!`)
3. Ir a **Usuarios** → aprobar al nuevo usuario y asignarle rol
4. **Login con el nuevo usuario** → verá solo las pestañas de su rol
5. **Rol producto:** registra un vinilo → queda pendiente
6. **Admin:** aprueba el vinilo desde Pendientes
7. **Rol pedido:** ve el vinilo en Catálogo → lo solicita
8. **Rol producto:** ve la solicitud en Solicitudes
9. **Admin:** aprueba el pedido desde Pedidos
---


