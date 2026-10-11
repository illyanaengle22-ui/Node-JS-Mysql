require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { upload, uploadDir } = require('./infrastructure/uploadAdapter');
const { autenticar, soloRol } = require('./interfaces/authMiddleware');
const { obtenerCaptcha } = require('./interfaces/captchaController');

//adapters infrastructure
const UserRepositoryAdapter = require('./infrastructure/userRepositoryAdapter');
const ProductRepositoryAdapter = require('./infrastructure/productRepositoryAdapter');
const OrderRepositoryAdapter = require('./infrastructure/orderRepositoryAdapter');
const EmailNotificationAdapter = require('./infrastructure/emailNotificationAdapter');
const AnalyticsRepositoryAdapter = require('./infrastructure/analyticsRepositoryAdapter');

//Servicios (aplicación)
const UserService = require('./application/userService');
const ProductService = require('./application/productService');
const OrderService = require('./application/orderService');
const { AnalyticsService } = require('./application/analyticsService');

//Controladores (interfaces) ---
const UserController = require('./interfaces/userController');
const ProductController = require('./interfaces/productController');
const OrderController = require('./interfaces/orderController');
const AnalyticsController = require('./interfaces/analyticsController');

const userRepository = new UserRepositoryAdapter();
const productRepository = new ProductRepositoryAdapter();
const orderRepository = new OrderRepositoryAdapter();
const emailNotification = new EmailNotificationAdapter();
const analyticsRepository = new AnalyticsRepositoryAdapter();

const userService = new UserService(userRepository);
const productService = new ProductService(productRepository);
const orderService = new OrderService(orderRepository, productRepository, userRepository, emailNotification);
const analyticsService = new AnalyticsService(analyticsRepository);

const userController = new UserController(userService);
const productController = new ProductController(productService);
const orderController = new OrderController(orderService);
const analyticsController = new AnalyticsController(analyticsService);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

//Captcha
app.get('/captcha', obtenerCaptcha);

// Usuarios / Auth
app.post('/usuarios', userController.register);
app.post('/usuarios/admin', autenticar, soloRol('admin'), userController.crearDesdeAdmin);   // ← nuevo
app.post('/login', userController.login);
app.put('/usuarios/:id', autenticar, userController.update);
app.put('/usuarios', autenticar, userController.updateByEmail);
app.put('/usuarios/:id/rol', autenticar, soloRol('admin'), userController.cambiarRol);       // ← nuevo
app.delete('/usuarios/:id', autenticar, soloRol('admin'), userController.remove);

// Panel de administración de accesos/roles (solo admin)
app.get('/usuarios', autenticar, soloRol('admin'), userController.list);
app.get('/usuarios/pendientes', autenticar, soloRol('admin'), userController.listPendientes);
app.put('/usuarios/:id/aprobar', autenticar, soloRol('admin'), userController.aprobar);
app.delete('/usuarios/:id/negar', autenticar, soloRol('admin'), userController.negar);
// Productos
app.post(
  '/productos',
  autenticar,
  soloRol('producto', 'admin'),
  upload.single('imagen'),
  productController.crear
);
app.get('/productos/catalogo', autenticar, productController.listarCatalogo);
app.get('/productos', autenticar, productController.listar);
app.get('/productos/recomendados', autenticar, productController.recomendados);
app.get('/productos/pendientes', autenticar, soloRol('admin'), productController.listarPendientes);
app.put(
  '/productos/:id',
  autenticar,
  soloRol('producto', 'admin'),
  upload.single('imagen'),
  productController.actualizar
);
app.put('/productos/:id/aprobar', autenticar, soloRol('admin'), productController.aprobar);
app.put('/productos/:id/rechazar', autenticar, soloRol('admin'), productController.rechazar);
app.delete('/productos/:id', autenticar, soloRol('admin', 'producto'), productController.eliminar);

//  Pedidos  
app.post('/pedidos', autenticar, soloRol('pedido'), orderController.crear);
app.put('/pedidos/:id/comprobante', autenticar, soloRol('pedido'), upload.single('comprobante'), orderController.subirComprobante);
app.get('/pedidos', autenticar, soloRol('admin', 'pedido'), orderController.listar);
app.get('/pedidos/mis-solicitudes', autenticar, soloRol('producto'), orderController.misSolicitudes);
app.get('/pedidos/:id', autenticar, soloRol('admin', 'pedido'), orderController.obtenerById);
app.put('/pedidos/:id/aprobar',  autenticar, soloRol('admin'), orderController.aprobar);
app.put('/pedidos/:id/rechazar', autenticar, soloRol('admin'), orderController.rechazar);
app.delete('/pedidos/:id', autenticar, soloRol('admin'), orderController.eliminar);

// ── Reportes analíticos (solo admin) ─────────────────────────────────────────
app.get('/reportes/top-productos',  autenticar, soloRol('admin'), analyticsController.topProductos);
app.get('/reportes/ingresos',       autenticar, soloRol('admin'), analyticsController.ingresos);
app.get('/reportes/estados',        autenticar, soloRol('admin'), analyticsController.estados);
app.get('/reportes/ticket-promedio',autenticar, soloRol('admin'), analyticsController.ticketPromedio);
app.get('/reportes/resumen',        autenticar, soloRol('admin'), analyticsController.resumen);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
