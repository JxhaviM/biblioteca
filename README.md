# Sistema de Gestión de Biblioteca

Este es un sistema completo para gestionar el uso de la biblioteca de una institución educativa.

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
