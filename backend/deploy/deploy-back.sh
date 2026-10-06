#!/bin/bash
# Uso: DB_PASSWORD=xxx JWT_SECRET=yyy ./deploy/deploy-back.sh <IP_PRIVADA_BD>
# Ejecutar desde la raíz de la rama back (donde está package.json)
set -e
DB_IP=$1
[ -z "$DB_IP" ] && { echo "Falta IP de la BD"; exit 1; }
: "${DB_PASSWORD:?Falta DB_PASSWORD}"
: "${JWT_SECRET:?Falta JWT_SECRET}"

sudo npm i -g pm2

npm install --omit=dev

# .env en la raíz del backend (= directorio de trabajo de pm2)
cat > .env <<EOF
PORT=3000
DB_HOST=$DB_IP
DB_PORT=5432
DB_USER=app
DB_PASSWORD=$DB_PASSWORD
DB_NAME=practica_api
JWT_SECRET=$JWT_SECRET
EOF

mkdir -p src/uploads
pm2 delete api 2>/dev/null || true
pm2 start dist/server.js --name api --cwd "$(pwd)"
pm2 save
