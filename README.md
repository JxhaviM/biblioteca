# 📚 Sistema de Biblioteca - Proyecto Completo

Sistema integral de gestión de biblioteca desarrollado como monorepo con **Node.js/Express** (backend) y **React/Vite** (frontend). Diseñado para gestionar libros, estudiantes, préstamos y generar reportes avanzados con funcionalidades inteligentes.

## 🚀 Guía de Instalación Local

### Requisitos Previos
- Node.js (v18 o superior)
- MongoDB (local o remoto)
- npm o yarn

### 1. Clonar el Repositorio
```bash
git clone <URL-del-repositorio>
cd biblioteca
```

### 2. Instalar Dependencias

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

### 3. Configurar Variables de Entorno

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Editar el archivo `.env`:
```env
# Base de Datos
MONGODB_URI=mongodb://localhost:27017/biblioteca

# Servidor
PORT=5000
HOST=0.0.0.0
NODE_ENV=development

# Configuración de CORS
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://172.16.3.253:3000

# JWT
JWT_SECRET=tu_secreto_jwt_aqui
JWT_EXPIRE=7d

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña
```

#### Frontend (.env)
```bash
cd frontend
```

Crear el archivo `.env`:
```env
# API Configuration
VITE_API_BASE_URL=/api

# App Configuration
VITE_APP_NAME=Sistema de Biblioteca
VITE_NODE_ENV=development
```

### 4. Iniciar MongoDB

#### Si tienes MongoDB instalado localmente:
```bash
# En Linux/macOS
sudo systemctl start mongod

# En Windows
net start MongoDB
```

#### O usar MongoDB Atlas (nube):
1. Ve a [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crea una cuenta y un cluster gratuito
3. Obtén tu cadena de conexión
4. Actualiza `MONGODB_URI` en tu `.env`

### 5. Ejecutar la Aplicación

#### Iniciar el Backend
```bash
cd backend
npm run dev
```
El backend estará disponible en: `http://localhost:5000`

#### Iniciar el Frontend (en otra terminal)
```bash
cd frontend
npm run dev
```
El frontend estará disponible en: `http://localhost:3000`

### 6. Acceso desde Otros Dispositivos en la Red Local

Para acceder desde otros dispositivos en la misma red:

1. **Obtener tu IP local**:
```bash
# En Linux/macOS
ip addr show | grep "inet " | grep -v 127.0.0.1

# En Windows
ipconfig | findstr "IPv4"
```

2. **Acceder desde otro dispositivo**:
- Frontend: `http://[TU_IP_LOCAL]:3000`
- Backend API: `http://[TU_IP_LOCAL]:5000`

### 7. Configurar Firewall (si es necesario)

#### Linux (UFW):
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 5000/tcp
```

#### Windows:
- Abre el Firewall de Windows
- Crea reglas de entrada para los puertos 3000 y 5000

## 🌟 Características Principales

### 🎯 Backend Completamente Funcional - MVP v1.0
- ✅ **API REST completa** con 5 módulos principales
- ✅ **Sistema de préstamos inteligente** con 6 estados automatizados
- ✅ **Gestión de múltiples copias** por libro
- ✅ **Autenticación JWT** y middleware de seguridad
- ✅ **Reportes y analytics** en tiempo real
- ✅ **Base de datos MongoDB** con Mongoose ODM

### 🔧 Arquitectura Robusta
- 📁 **Patrón MVC** bien estructurado
- 🔄 **Middleware automático** para actualización de estados
- 🔍 **Búsqueda avanzada** con filtros múltiples
- 📊 **Agregaciones complejas** para reportes
- 🛡️ **Manejo de errores** robusto
- 🔧 **Validaciones** a nivel de esquema

### 📱 Frontend Preparado
- ⚛️ **React 18** con TypeScript
- ⚡ **Vite** para desarrollo rápido
- 🎨 **Tailwind CSS** para styling
- 📦 **Componentes modulares** listos

## 🚀 Estado Actual del Proyecto

### ✅ Completado (Backend MVP v1.0)
- [x] **Modelos de datos** avanzados (Book, Student, Loan, User)
- [x] **Controladores** con lógica de negocio completa
- [x] **Rutas API** documentadas y funcionales (5 módulos core)
- [x] **Middleware** de autenticación y actualización automática
- [x] **Servicios** de programación y mantenimiento
- [x] **Servidor** optimizado y sin errores
- [x] **Documentación** completa (API, Arquitectura, Instalación)

### 🔄 En Desarrollo (v1.1)
- [ ] **Sistema PQR** completo (documentado, listo para implementar)
- [ ] **Notificaciones** automáticas por email
- [ ] **Frontend React** integración completa

### 🔄 En Progreso (Frontend)
- [ ] **Integración** con API backend
- [ ] **Páginas** de gestión (Books, Students, Loans)
- [ ] **Dashboard** de reportes
- [ ] **Autenticación** de usuarios
- [ ] **Componentes** de formularios

### 🎯 Pendiente (Futuras Features v1.2+)
- [ ] **Notificaciones** automáticas
- [ ] **Sistema de multas** y penalizaciones
- [ ] **Códigos QR/Barcode** para libros
- [ ] **Reservas** de libros
- [ ] **Exportación** de reportes (PDF/Excel)

## 📊 Tecnologías Utilizadas

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Base de Datos**: MongoDB + Mongoose ODM
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Mongoose schemas + custom validators
- **Seguridad**: bcryptjs, CORS, middleware personalizado
- **Desarrollo**: nodemon, dotenv, Morgan logging

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + PostCSS
- **Linting**: ESLint
- **Desarrollo**: Hot Module Replacement (HMR)

### DevOps & Tools
- **Package Manager**: npm workspaces (monorepo)
- **Version Control**: Git
- **Environment**: .env files
- **Documentation**: Markdown docs

## Estructura del Proyecto

```
biblioteca/
├── package.json              # Configuración raíz y scripts de orquestación
├── README.md                 # Este archivo
├── .gitignore               # Archivos a ignorar en git
├── backend/                 # API del servidor
│   ├── package.json         # Dependencias específicas del backend
│   ├── server.js           # Punto de entrada del servidor
│   ├── config/             # Configuraciones
│   ├── controllers/        # Controladores de rutas
│   ├── middlewares/        # Middlewares personalizados
│   ├── models/            # Modelos de base de datos
│   └── routes/            # Definición de rutas
└── frontend/              # Aplicación cliente React
    ├── package.json       # Dependencias específicas del frontend
    ├── src/              # Código fuente
    ├── public/           # Archivos públicos
    └── ...              # Configuración de Vite, TypeScript, etc.
```

## Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- npm
- MongoDB

### Instalación Completa
```bash
# Instalar todas las dependencias
npm run install:all
```

### Instalación Individual
```bash
# Solo raíz
npm install

# Solo backend
cd backend && npm install

# Solo frontend
cd frontend && npm install
```

## Scripts Disponibles

### Desarrollo
```bash
# Ejecutar backend y frontend simultáneamente
npm run dev

# Solo backend en modo desarrollo
npm run dev:backend

# Solo frontend en modo desarrollo
npm run dev:frontend
```

### Producción
```bash
# Iniciar servidor de producción
npm start

# Construir frontend para producción
npm run build
```

### Mantenimiento
```bash
# Limpiar todos los node_modules
npm run clean

# Reinstalar todo desde cero
npm run clean && npm run install:all
```

## Tecnologías Utilizadas

### Backend
- Node.js
- Express.js
- MongoDB con Mongoose
- JWT para autenticación
- bcryptjs para encriptación
- CORS para manejo de peticiones cross-origin

### Frontend
- React con TypeScript
- Vite como bundler
- Tailwind CSS para estilos
- ESLint para linting

## Variables de Entorno

El proyecto utiliza una estructura de variables de entorno distribuida para mejor organización y seguridad:

### 📁 **Estructura de Variables:**

```
biblioteca/
├── .env                     # Variables globales compartidas (opcionales)
├── backend/.env            # Variables específicas del servidor
├── backend/.env.example    # Plantilla para backend
├── frontend/.env           # Variables específicas del cliente
└── frontend/.env.example   # Plantilla para frontend
```

### 🔧 **Backend (`backend/.env`):**
```bash
# Base de datos
MONGO_URI=mongodb://localhost:27017/biblioteca

# Autenticación
JWT_SECRET=tu_secreto_jwt_seguro

# Servidor
PORT=5000
NODE_ENV=development
```

### 🎨 **Frontend (`frontend/.env`):**
```bash
# API Backend (debe usar prefijo VITE_ para Vite)
VITE_API_URL=http://localhost:5000/api

# Configuración de la app
VITE_APP_NAME=Sistema de Biblioteca
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
```

### 🌐 **Globales (`.env` raíz) - Opcional:**
```bash
# Solo para variables realmente compartidas
PROJECT_NAME=biblioteca
PROJECT_VERSION=1.0.0
ENVIRONMENT=development
```

### ⚡ **Configuración Inicial:**
```bash
# Copiar plantillas y configurar
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Editar archivos con tus valores específicos
```

### 🔒 **Importante:**
- **Backend**: Todas las variables son privadas
- **Frontend**: Solo variables con prefijo `VITE_` son expuestas al navegador
- **Nunca** commits archivos `.env` (están en `.gitignore`)
- **Siempre** mantén archivos `.env.example` actualizados

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request
