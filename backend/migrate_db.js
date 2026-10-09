const pool = require('./src/infrastructure/db');

(async () => {
  try {
    await pool.query('ALTER TABLE pedidos ADD COLUMN comprobante_url VARCHAR(255);');
    console.log('Columna comprobante_url agregada exitosamente.');
  } catch (err) {
    console.error('Error (puede que ya exista):', err.message);
  }
  process.exit();
})();
