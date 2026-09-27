const crypto = require('crypto');

const store = new Map(); 
const TTL_MS = 5 * 60 * 1000; // 5 minutos

function guardar(texto) {
  const id = crypto.randomUUID();
  store.set(id, { texto: texto.toLowerCase(), expira: Date.now() + TTL_MS });
  return id;
}

function validar(id, respuesta) {
  const entrada = store.get(id);
  store.delete(id); // un solo uso
  if (!entrada) return false;
  if (Date.now() > entrada.expira) return false;
  return entrada.texto === String(respuesta || '').toLowerCase();
}

module.exports = { guardar, validar };
