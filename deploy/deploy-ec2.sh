#!/usr/bin/env bash
set -Eeuo pipefail

# Actualiza una instalacion existente. La configuracion inicial de systemd y
# Nginx debe estar creada previamente en el servidor.
APP_DIR=/opt/farmaciaweb
BACKEND_DIR="$APP_DIR/farmacia-backend"
FRONTEND_DIR="$APP_DIR/farmacia-frontend"
BACKEND_JAR="$BACKEND_DIR/target/farmacia-0.0.1-SNAPSHOT.jar"
BACKEND_ENV="$BACKEND_DIR/.env"
RUNTIME_DIR=/opt/farmacia-app
FRONTEND_WEB_DIR=/var/www/farmacia-frontend
FRONTEND_BUILD_DIR="$FRONTEND_DIR/dist/farmacia-frontend/browser"
SERVICE_NAME=farmacia-backend

if [ ! -d "$APP_DIR/.git" ]; then
  echo "No se encontro el repositorio en $APP_DIR" >&2
  exit 1
fi

if [ ! -f "$BACKEND_ENV" ]; then
  echo "Falta $BACKEND_ENV. Crealo a partir de .env.example." >&2
  exit 1
fi

if ! sudo systemctl cat "$SERVICE_NAME" >/dev/null 2>&1; then
  echo "El servicio $SERVICE_NAME no esta instalado." >&2
  exit 1
fi

echo "Actualizando codigo desde Git..."
cd "$APP_DIR"
git pull --ff-only origin main

echo "Compilando backend..."
cd "$BACKEND_DIR"
./mvnw -DskipTests clean package

echo "Compilando frontend..."
cd "$FRONTEND_DIR"
npm ci
npm run build

if [ ! -f "$BACKEND_JAR" ]; then
  echo "No se genero el JAR: $BACKEND_JAR" >&2
  exit 1
fi

if [ ! -d "$FRONTEND_BUILD_DIR" ]; then
  echo "No se genero el frontend: $FRONTEND_BUILD_DIR" >&2
  exit 1
fi

echo "Publicando backend..."
sudo install -m 0644 "$BACKEND_JAR" "$RUNTIME_DIR/farmacia.jar"
sudo install -m 0600 "$BACKEND_ENV" "$RUNTIME_DIR/.env"
sudo systemctl restart "$SERVICE_NAME"

echo "Publicando frontend..."
sudo rm -rf "$FRONTEND_WEB_DIR"
sudo install -d -m 0755 "$FRONTEND_WEB_DIR"
sudo cp -a "$FRONTEND_BUILD_DIR/." "$FRONTEND_WEB_DIR/"
sudo nginx -t
sudo systemctl reload nginx

if ! sudo systemctl is-active --quiet "$SERVICE_NAME"; then
  echo "El backend no pudo iniciar. Revisa: sudo journalctl -u $SERVICE_NAME -n 100" >&2
  exit 1
fi

echo "Actualizacion completada correctamente."
