#!/bin/bash
# Uso: ./deploy-front.sh <IP_PRIVADA_BACKEND>
set -e
BACKEND_IP=$1
[ -z "$BACKEND_IP" ] && { echo "Falta IP del backend"; exit 1; }

sudo apt-get update -y && sudo apt-get install -y nginx
sudo rm -rf /var/www/app && sudo mkdir -p /var/www/app
sudo cp -r dist/* /var/www/app/

sed "s/BACKEND_IP/$BACKEND_IP/g" deploy/nginx.conf.template | sudo tee /etc/nginx/conf.d/app.conf >/dev/null
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
echo "Front listo"
