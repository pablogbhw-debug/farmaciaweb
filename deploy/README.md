# Despliegue en EC2 con Java + Nginx

## Requisitos en la instancia EC2

- Amazon Linux 2 o Ubuntu
- Java 21
- Maven
- Node.js 20+
- Nginx
- Git
- MySQL

## Instalar dependencias

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install -y openjdk-21-jdk maven nginx git nodejs npm
```

### Amazon Linux 2
```bash
sudo yum update -y
sudo amazon-linux-extras install java-openjdk11 -y
sudo yum install -y maven nginx git nodejs
```

## Subir el proyecto
```bash
sudo mkdir -p /opt/farmaciaweb
cd /opt/farmaciaweb
git clone <TU_REPO_URL> .
```

## Actualizar una instalacion existente

Despues de subir los cambios a la rama `main`, ejecuta en el servidor:

```bash
cd /opt/farmaciaweb/farmaciaweb/deploy
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

El script obtiene los cambios con `git pull --ff-only`, compila ambos proyectos,
reemplaza el JAR y los archivos del frontend, reinicia el backend y recarga
Nginx. No vuelve a crear los servicios ni su configuracion.

La publicacion conserva `.env`, systemd y la configuracion activa de Nginx.
Antes de reemplazar archivos valida las compilaciones; además guarda el JAR y
el frontend anteriores. Si el backend nuevo no responde, restaura el JAR previo.

Si `deploy/deploy-ec2.sh` tiene cambios locales en el servidor, el script crea
una copia en `/tmp`, restaura solamente ese archivo y continua con el `pull`.
Los cambios locales en cualquier otro archivo no se descartan.

## Variables importantes

Las credenciales y la configuraciÃ³n sensible se guardan en
`farmacia-backend/.env`. Este archivo no se versiona. Usa
`farmacia-backend/.env.example` como plantilla.

Revisa tambiÃ©n el DNS pÃºblico y el usuario del servicio (`ec2-user` o
`ubuntu`) en el script antes de ejecutarlo.

## Verificar servicios
```bash
sudo systemctl status farmacia-backend
sudo systemctl status nginx
```

## Logs
```bash
sudo journalctl -u farmacia-backend -f
```
