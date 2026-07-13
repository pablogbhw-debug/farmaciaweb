#!/usr/bin/env bash
set -Eeuo pipefail

# Ejecuta una copia temporal para poder actualizar este mismo archivo durante
# el git pull sin interrumpir el proceso actual.
if [ "${DEPLOY_RUNNING_FROM_TMP:-0}" != "1" ]; then
  SOURCE_SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
  TEMP_SCRIPT="$(mktemp /tmp/farmacia-deploy.XXXXXX)"
  cp -- "${BASH_SOURCE[0]}" "$TEMP_SCRIPT"
  chmod 700 "$TEMP_SCRIPT"
  exec env DEPLOY_RUNNING_FROM_TMP=1 DEPLOY_TEMP_SCRIPT="$TEMP_SCRIPT" \
    DEPLOY_SOURCE_DIR="$SOURCE_SCRIPT_DIR" \
    "$TEMP_SCRIPT" "$@"
fi

# Actualiza una instalacion existente. La configuracion inicial de systemd y
# Nginx debe estar creada previamente en el servidor.
SCRIPT_DIR="${DEPLOY_SOURCE_DIR:?No se pudo determinar la ubicacion del script}"
APP_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$APP_DIR/farmacia-backend"
FRONTEND_DIR="$APP_DIR/farmacia-frontend"
BACKEND_JAR="$BACKEND_DIR/target/farmacia-0.0.1-SNAPSHOT.jar"
BACKEND_ENV="$BACKEND_DIR/.env"
RUNTIME_DIR=/opt/farmacia-app
FRONTEND_WEB_DIR=/var/www/farmacia-frontend
FRONTEND_BUILD_DIR="$FRONTEND_DIR/dist/farmacia-frontend/browser"
SERVICE_NAME=farmacia-backend
BACKEND_RUNTIME_JAR="$RUNTIME_DIR/farmacia.jar"
BACKEND_BACKUP_JAR="$RUNTIME_DIR/farmacia.jar.previous"
FRONTEND_STAGE_DIR="/var/www/.farmacia-frontend.new.$$"
FRONTEND_BACKUP_DIR="/var/www/.farmacia-frontend.previous"

cleanup() {
  rm -f -- "${DEPLOY_TEMP_SCRIPT:-}"
  sudo rm -rf -- "$FRONTEND_STAGE_DIR"
}

trap cleanup EXIT

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

# En el servidor este archivo pudo haberse ajustado manualmente. Se respalda
# y se restaura solo el script para que no bloquee el pull. Cualquier otro
# cambio local sigue protegido por Git y detendra la actualizacion.
DEPLOY_SCRIPT=deploy/deploy-ec2.sh
if ! git diff --quiet -- "$DEPLOY_SCRIPT" || \
   ! git diff --cached --quiet -- "$DEPLOY_SCRIPT"; then
  BACKUP_FILE="/tmp/deploy-ec2.sh.$(date +%Y%m%d%H%M%S).backup"
  cp -- "$DEPLOY_SCRIPT" "$BACKUP_FILE"
  git restore --source=HEAD --staged --worktree -- "$DEPLOY_SCRIPT"
  echo "Cambio local del script respaldado en $BACKUP_FILE"
fi

BACKEND_PORT="$(sed -n 's/^SERVER_PORT=//p' "$BACKEND_ENV" | tail -n 1 | tr -d '\r')"
BACKEND_PORT="${BACKEND_PORT:-8060}"

SERVICE_USER="$(sudo systemctl show -p User --value "$SERVICE_NAME")"
if [ -z "$SERVICE_USER" ]; then
  SERVICE_USER=root
fi
SERVICE_GROUP="$(id -gn "$SERVICE_USER")"

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
if [ -f "$BACKEND_RUNTIME_JAR" ]; then
  sudo cp -p -- "$BACKEND_RUNTIME_JAR" "$BACKEND_BACKUP_JAR"
fi

sudo install -m 0644 "$BACKEND_JAR" "$BACKEND_RUNTIME_JAR"
sudo install -o "$SERVICE_USER" -g "$SERVICE_GROUP" -m 0600 \
  "$BACKEND_ENV" "$RUNTIME_DIR/.env"
sudo systemctl restart "$SERVICE_NAME"

echo "Comprobando backend..."
BACKEND_READY=0
for _ in $(seq 1 30); do
  if sudo systemctl is-active --quiet "$SERVICE_NAME" && \
     curl --silent --show-error --output /dev/null --max-time 2 \
       "http://127.0.0.1:$BACKEND_PORT/"; then
    BACKEND_READY=1
    break
  fi
  sleep 1
done

if [ "$BACKEND_READY" != "1" ]; then
  echo "El backend nuevo no respondio; restaurando la version anterior..." >&2
  if [ -f "$BACKEND_BACKUP_JAR" ]; then
    sudo cp -p -- "$BACKEND_BACKUP_JAR" "$BACKEND_RUNTIME_JAR"
    sudo systemctl restart "$SERVICE_NAME"
  fi
  echo "Revisa: sudo journalctl -u $SERVICE_NAME -n 100 --no-pager" >&2
  exit 1
fi

echo "Publicando frontend..."
sudo install -d -m 0755 "$FRONTEND_STAGE_DIR"
sudo cp -a "$FRONTEND_BUILD_DIR/." "$FRONTEND_STAGE_DIR/"
sudo nginx -t

sudo rm -rf -- "$FRONTEND_BACKUP_DIR"
if [ -d "$FRONTEND_WEB_DIR" ]; then
  sudo mv -- "$FRONTEND_WEB_DIR" "$FRONTEND_BACKUP_DIR"
fi
sudo mv -- "$FRONTEND_STAGE_DIR" "$FRONTEND_WEB_DIR"

if ! sudo systemctl reload nginx; then
  echo "Nginx no pudo recargarse; restaurando el frontend anterior..." >&2
  sudo rm -rf -- "$FRONTEND_WEB_DIR"
  if [ -d "$FRONTEND_BACKUP_DIR" ]; then
    sudo mv -- "$FRONTEND_BACKUP_DIR" "$FRONTEND_WEB_DIR"
  fi
  sudo systemctl reload nginx || true
  exit 1
fi

echo "Actualizacion completada correctamente."
