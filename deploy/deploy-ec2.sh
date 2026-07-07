#!/bin/bash
set -e

APP_DIR=/opt/farmaciaweb
BACKEND_DIR=$APP_DIR/farmacia-backend
FRONTEND_DIR=$APP_DIR/farmacia-frontend
BACKEND_JAR=$BACKEND_DIR/target/farmacia-0.0.1-SNAPSHOT.jar

sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

cd $APP_DIR
if [ ! -d "$BACKEND_DIR" ]; then
  git clone <TU_REPO_URL> $APP_DIR
fi

cd $BACKEND_DIR
./mvnw -DskipTests package

if [ ! -f "$BACKEND_JAR" ]; then
  echo "No se encontró el JAR del backend" >&2
  exit 1
fi

sudo mkdir -p /opt/farmacia-app
sudo cp "$BACKEND_JAR" /opt/farmacia-app/farmacia.jar

sudo tee /etc/systemd/system/farmacia-backend.service > /dev/null <<'EOF'
[Unit]
Description=Farmacia Backend
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/opt/farmacia-app
ExecStart=/usr/bin/java -jar /opt/farmacia-app/farmacia.jar
Restart=always
Environment=SERVER_PORT=8060
Environment=DB_URL=jdbc:mysql://localhost:3306/farmacia_db?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC
Environment=DB_USERNAME=farmacia_user
Environment=DB_PASSWORD=pwx1008184
Environment=JWT_SECRET=MiClaveJWTMuySeguraParaFarmacia2026Backend
Environment=ALLOWED_ORIGINS=http://localhost,http://127.0.0.1,http://ec2-3-147-71-131.us-east-2.compute.amazonaws.com

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable farmacia-backend
sudo systemctl restart farmacia-backend

cd $FRONTEND_DIR
npm install
npm run build

sudo rm -rf /var/www/farmacia-frontend
sudo mkdir -p /var/www/farmacia-frontend
sudo cp -r dist/farmacia-frontend/browser/* /var/www/farmacia-frontend/

sudo tee /etc/nginx/sites-available/farmacia.conf > /dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/farmacia-frontend;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8060;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /auth/ {
        proxy_pass http://127.0.0.1:8060;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/farmacia.conf /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "Despliegue listo"
echo "Frontend: ec2-3-147-71-131.us-east-2.compute.amazonaws.com"
echo "Backend: http://ec2-3-147-71-131.us-east-2.compute.amazonaws.com/api/..."
