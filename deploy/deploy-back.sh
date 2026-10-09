#!/bin/bash
# Uso: DB_PASSWORD=xxx JWT_SECRET=yyy ./deploy/deploy-back.sh <IP_PRIVADA_BD>
# Ejecutar desde la raíz de la rama back (donde está package.json)
set -e
DB_IP=$1
[ -z "$DB_IP" ] && { echo "Falta IP de la BD"; exit 1; }
: "${DB_PASSWORD:?Falta DB_PASSWORD}"
: "${JWT_SECRET:?Falta JWT_SECRET}"
: "${SMTP_USER:?Falta SMTP_USER}"
: "${SMTP_PASS:?Falta SMTP_PASS}"
: "${ADMIN_EMAIL:?Falta ADMIN_EMAIL}"

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm i -g pm2

npm ci --omit=dev

# .env en la raíz del backend (= directorio de trabajo de pm2)
cat > .env <<EOF
PORT=3000
DB_HOST=$DB_IP
DB_PORT=5432
DB_USER=app
DB_PASSWORD=$DB_PASSWORD
DB_NAME=practica_api
JWT_SECRET=$JWT_SECRET
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
ADMIN_EMAIL=$ADMIN_EMAIL
EOF

mkdir -p src/uploads
pm2 delete api 2>/dev/null || true
pm2 start src/server.js --name api --cwd "$(pwd)"
pm2 save
