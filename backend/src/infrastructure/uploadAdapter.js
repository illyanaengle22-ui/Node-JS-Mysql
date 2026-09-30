const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nombreUnico = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, nombreUnico);
  },
});

function filtroImagen(req, file, cb) {
  const tiposPermitidos = /jpeg|jpg|png|webp/;
  const extValida = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
  const mimeValido = tiposPermitidos.test(file.mimetype);
  if (extValida && mimeValido) return cb(null, true);
  cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
}

const upload = multer({
  storage,
  fileFilter: filtroImagen,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Devuelve solo la ruta 
function rutaPublica(filename) {
  return `/uploads/${filename}`;
}

module.exports = { upload, rutaPublica, uploadDir };
