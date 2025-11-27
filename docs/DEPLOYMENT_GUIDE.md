# Guía de Despliegue y Operaciones

Esta guía describe los pasos necesarios para desplegar y mantener el proyecto **Biblioteca Digital** en entornos de desarrollo, pruebas y producción.

## 1. Requisitos Previos

- **Sistema Operativo**: Linux (Ubuntu 22.04 LTS recomendado) o Windows Server 2019+
- **Node.js**: versión 18.x LTS
- **npm**: versión 9+
- **MongoDB**: versión 6.x (instancia replicada para producción)
- **Redis** *(opcional)*: para colas y caché si se habilita
- **Nginx/Apache**: como reverse proxy para servir frontend y API
- **Certificados SSL**: requeridos para HTTPS en producción
- **Accesos**: credenciales SSH, permisos de escritura en el servidor

## 2. Variables de Entorno

Crea archivos `.env` en las carpetas `backend/` y `frontend/`. Usa los siguientes ejemplos como base:

### 2.1 Backend (`backend/.env`)

```
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://usuario:password@host:27017/biblioteca
JWT_SECRET=super_secret_token
JWT_EXPIRES=7d
ALLOW_ORIGINS=http://localhost:5173,https://app.biblioteca.com
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=notificaciones@example.com
MAIL_PASS=super-password
LOG_LEVEL=info
# --- Bootstrap inicial de SuperAdministrador ---
SUPERADMIN_EMAIL=rector@example.com
SUPERADMIN_PASSWORD=PasswordSegura123
SUPERADMIN_DOC=123456789
SUPERADMIN_NAME="Rector Ejemplo"
# Opcionales con valores por defecto
# SUPERADMIN_DOC_TYPE=CC
# SUPERADMIN_GENDER=Masculino
# SUPERADMIN_PHONE=3000000000
# SUPERADMIN_ADDRESS=Calle 1 # 2-3
```

**Variables obligatorias**

- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`
- `SUPERADMIN_DOC`
- `SUPERADMIN_NAME`

**Variables opcionales**

- `SUPERADMIN_DOC_TYPE` (por defecto `CC`)
- `SUPERADMIN_GENDER` (por defecto `Masculino`)
- `SUPERADMIN_PHONE`
- `SUPERADMIN_ADDRESS`

### 2.2 Frontend (`frontend/.env`)

```
VITE_API_URL=https://api.biblioteca.com
VITE_APP_NAME=Biblioteca Digital
VITE_FORCE_HTTPS=true
```

> **Importante**: Nunca subas los archivos `.env` al repositorio. Mantén credenciales en un gestor seguro.

## 3. Instalación Inicial

1. **Clonar el repositorio** en el servidor:
   ```bash
   git clone https://github.com/JxhaviM/biblioteca.git
   cd biblioteca
   ```
2. **Instalar dependencias** de backend y frontend:
   ```bash
   npm install
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   ```
3. **Configurar permisos** para directorios de carga:
   ```bash
   mkdir -p backend/uploads/covers
   chmod -R 755 backend/uploads
   ```
4. **Configurar base de datos**:
   - Crear usuario con permisos `readWrite` en MongoDB.
   - Ejecutar scripts de inicialización si aplica (`backend/scripts/*.js`).
5. **Verificar creación automática del SuperAdministrador**:
   - Asegúrate de definir las variables de entorno anteriores antes de iniciar el backend.
   - Al arrancar `npm run dev:backend` o `node server.js`, revisa la consola: si no existía ningún superadmin activo se creará uno nuevo y se mostrará el username generado.
   - Si ya existe un superadmin, el proceso indicará que no se realizará ninguna creación adicional.

## 4. Despliegue del Backend

### 4.1 Entorno de desarrollo
- Ejecuta `npm run dev:backend` desde la raíz (usa `nodemon`).
- El servidor escucha en `http://localhost:5000`.

### 4.2 Entorno de producción
1. Compila dependencias y verificación:
   ```bash
   cd backend
   npm ci --only=production
   npm run lint
   npm run test   # si hay pruebas automatizadas
   ```
2. Inicia con **PM2** (recomendado):
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   ```
3. Configura Nginx para redirigir `/api/*` hacia `http://127.0.0.1:5000`.

### 4.3 Logs y monitoreo
- PM2: `pm2 logs` y `pm2 monit` para revisar procesos.
- Registros de aplicación: `backend/logs/` (configura rotación).

## 5. Despliegue del Frontend

### 5.1 Entorno de desarrollo
- Ejecuta `npm run dev:frontend` desde la raíz (usa Vite con HMR).
- Interface disponible en `http://localhost:5173`.

### 5.2 Entorno de producción
1. Desde `frontend/`, compila la aplicación:
   ```bash
   npm run build
   ```
2. Los archivos generados en `frontend/dist/` se copian al directorio público servido por Nginx (`/var/www/biblioteca`).
3. Configura Nginx para servir contenido estático y reenviar API.

## 6. Base de Datos y Backups

- Configura replicación o backups automáticos en MongoDB.
- Programar `mongodump` diario y almacenar en almacenamiento seguro.
- Para restaurar: `mongorestore --drop /ruta/al/dump`.
- Documenta scripts en `docs/MAINTENANCE_GUIDE.md`.

## 7. Integración Continua (CI/CD)

- Usa GitHub Actions o similar para ejecutar pruebas en cada push.
- Pipeline sugerido:
  1. Instalar dependencias
  2. Lint y pruebas
  3. Construir frontend
  4. Desplegar a staging y luego a producción mediante aprobación manual.

## 8. Gestión de Configuraciones

- Mantén plantillas `.env.example` actualizadas.
- Usa servicios de secretos (AWS Secrets Manager, Vault) en producción.
- Documenta cambios en `docs/CHANGELOG.md` y notifica al equipo.

## 9. Recuperación ante Desastres

- Mantén respaldos diarios (DB y archivos subidos).
- Documenta procedimiento de restauración rápida.
- Prueba el proceso cada trimestre.

## 10. Contactos de Operación

- Responsable DevOps: devops@example.com
- Responsable Base de Datos: dba@example.com
- Escalamiento crítico: +57 300 000 0000

> Actualiza este documento cada vez que cambien scripts, infraestructura o dependencias críticas.
