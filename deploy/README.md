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

## Ejecutar el script de despliegue
```bash
chmod +x deploy/deploy-ec2.sh
./deploy/deploy-ec2.sh
```

## Variables importantes

Editar el archivo del script y reemplazar:
- <TU_REPO_URL>
- tu_password
- TU_PUBLIC_DNS
- el usuario del servicio (ec2-user o ubuntu)

## Verificar servicios
```bash
sudo systemctl status farmacia-backend
sudo systemctl status nginx
```

## Logs
```bash
sudo journalctl -u farmacia-backend -f
```
