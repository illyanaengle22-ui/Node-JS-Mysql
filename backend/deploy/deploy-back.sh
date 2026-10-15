#!/bin/bash
# Uso: DB_PASSWORD=xxx JWT_SECRET=yyy SMTP_USER=xxx SMTP_PASS=xxx ADMIN_EMAIL=xxx \
#      ./deploy/deploy-back.sh <IP_PRIVADA_BD>
# Ejecutar desde app/backend (donde esta package.json)
set -e
DB_IP=$1
[ -z "$DB_IP" ] && { echo "Falta IP de la BD"; exit 1; }
: "${DB_PASSWORD:?Falta DB_PASSWORD}"
: "${JWT_SECRET:?Falta JWT_SECRET}"
: "${SMTP_USER:?Falta SMTP_USER}"
: "${SMTP_PASS:?Falta SMTP_PASS}"
: "${ADMIN_EMAIL:?Falta ADMIN_EMAIL}"

sudo npm i -g pm2
npm install --omit=dev

# .env en el directorio de trabajo de pm2
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

mkdir -p uploads
pm2 delete api 2>/dev/null || true
pm2 start dist/server.js --name api --cwd "$(pwd)"
pm2 save
