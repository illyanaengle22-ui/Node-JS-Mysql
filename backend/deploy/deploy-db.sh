#!/bin/bash
# Uso: DB_PASSWORD=xxx ./deploy-db.sh [CIDR_VPC]
set -e
VPC_CIDR=${1:-172.31.0.0/16}
: "${DB_PASSWORD:?Falta DB_PASSWORD}"

sudo apt-get update -y
sudo apt-get install -y postgresql postgresql-contrib

PGVER=$(ls /etc/postgresql | head -n1)
CONF=/etc/postgresql/$PGVER/main
sudo sed -i "s/^#\?listen_addresses.*/listen_addresses = '*'/" $CONF/postgresql.conf
echo "host    practica_api    app    $VPC_CIDR    scram-sha-256" | sudo tee -a $CONF/pg_hba.conf
sudo systemctl restart postgresql

sudo -u postgres psql <<EOF
CREATE USER app WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE practica_api OWNER app;
EOF

# Cargar datos (ejecutar desde la carpeta que contiene migrations/)
PGPASSWORD=$DB_PASSWORD psql -h localhost -U app -d practica_api -f migrations/000_init_completo.sql
