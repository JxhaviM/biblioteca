# 🚀 Guía Completa de Producción: Render + Vercel + MongoDB Atlas

## 📋 Tabla de Contenidos
1. [Arquitectura de Despliegue](#️-arquitectura-de-despliegue)
2. [MongoDB Atlas - Base de Datos](#️-mongodb-atlas---base-de-datos)
3. [Backend - Preparación para Render](#-backend---preparación-para-render)
4. [Frontend - Preparación para Vercel](#-frontend---preparación-para-vercel)
5. [Proceso de Despliegue Paso a Paso](#-proceso-de-despliegue-paso-a-paso)
6. [Configuraciones Críticas de Producción](#-configuraciones-críticas-de-producción)
7. [Checklist Pre-Producción](#️-checklist-pre-producción)
8. [Comandos de Build y Deploy](#-comandos-de-build-y-deploy)
9. [Monitoreo y Debugging](#-monitoreo-y-debugging)
10. [URLs Finales de Producción](#️-urls-finales-de-producción)
11. [Optimizaciones Adicionales](#️-optimizaciones-adicionales)
12. [Troubleshooting Común](#️-troubleshooting-común)

---

## 🏗️ Arquitectura de Despliegue

```
Frontend (React) → Vercel
Backend (Node.js) → Render
Base de Datos → MongoDB Atlas
```

---

## 🗄️ MongoDB Atlas - Base de Datos

### 🔧 Configuración
1. **Crear cuenta**: https://www.mongodb.com/atlas
2. **Crear cluster**:
   - Plan: **M0 Sandbox** (Gratis)
   - Region: Más cercana a tus usuarios
3. **Configurar acceso**:
   ```javascript
   // IP Access: 0.0.0.0/0 (permitir todo para producción)
   // Database User: biblioteca_user
   // Password: contraseña_segura_123
   ```

### 📝 Variables de Entorno
```bash
# .env (backend)
MONGODB_URI=mongodb+srv://biblioteca_user:contraseña_segura_123@cluster0.xxxxx.mongodb.net/biblioteca?retryWrites=true&w=majority
```

---

## 🔧 Backend - Preparación para Render

### 📦 package.json - Agregar scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "echo 'Backend build completed'",
    "dev": "nodemon server.js"
  }
}
```

### 🔐 Variables de Entorno - Render
```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://biblioteca_user:contraseña_segura_123@cluster0.xxxxx.mongodb.net/biblioteca
JWT_SECRET=super_secreto_jwt_para_produccion
FRONTEND_URL=https://tu-app.vercel.app
```

### 🌐 server.js - Configuración de producción
```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS para producción
app.use(cors({
  origin: ['https://tu-app.vercel.app', 'http://localhost:3000'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/bookRoutes'));
// ... otras rutas

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
```

---

## 🎨 Frontend - Preparación para Vercel

### 📦 package.json - Configuración
```json
{
  "name": "biblioteca-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0"
  }
}
```

### 🔐 Variables de Entorno - Vercel
```bash
VITE_API_URL=https://tu-backend.onrender.com
```

### 🌐 vite.config.ts - Configuración de producción
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
});
```

### 📁 vercel.json - Configuración de Vercel
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 🚀 Proceso de Despliegue Paso a Paso

### 🗄️ Paso 1: MongoDB Atlas
```bash
1. Ve a https://www.mongodb.com/atlas
2. Crea cuenta y organiza proyecto
3. Crea cluster M0 (gratis)
4. Configura usuario de base de datos
5. Configura acceso IP (0.0.0.0/0)
6. Obtén connection string
```

### 🔧 Paso 2: Backend en Render
```bash
1. Sube backend a GitHub
2. Ve a https://render.com
3. Conecta tu cuenta de GitHub
4. "New +" → "Web Service"
5. Selecciona tu repositorio del backend
6. Configura:
   - Name: biblioteca-backend
   - Runtime: Node
   - Build Command: npm install
   - Start Command: npm start
7. Agrega variables de entorno:
   - NODE_ENV=production
   - MONGODB_URI=tu_connection_string
   - JWT_SECRET=tu_secreto
8. "Create Web Service"
```

### 🎨 Paso 3: Frontend en Vercel
```bash
1. Sube frontend a GitHub
2. Ve a https://vercel.com
3. Conecta tu cuenta de GitHub
4. "Add New..." → "Project"
5. Selecciona tu repositorio del frontend
6. Configura:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: dist
7. Agrega variables de entorno:
   - VITE_API_URL=https://tu-backend.onrender.com
8. "Deploy"
```

---

## 🔧 Configuraciones Críticas de Producción

### 🌐 Backend - CORS y Seguridad
```javascript
// middleware/auth.js - JWT robusto
const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ message: 'Acceso no autorizado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};
```

### 🎨 Frontend - API Config
```typescript
// src/api/auth.ts - API de producción
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};
```

---

## ✅ Checklist Pre-Producción

### 🔧 Backend Checklist
```bash
[ ] Variables de entorno configuradas
[ ] MongoDB Atlas conectado
[ ] CORS configurado para dominio de Vercel
[ ] JWT secret seguro y único
[ ] Uploads folder configurado
[ ] Manejo de errores implementado
[ ] Logs de producción configurados
[ ] Health check endpoint (/api/health)
```

### 🎨 Frontend Checklist
```bash
[ ] VITE_API_URL configurado
[ ] Build exitoso localmente
[ ] Imágenes optimizadas
[ ] Console.log eliminados ✅
[ ] Environment variables validados
[ ] Routing configurado para SPA
[ ] Error boundaries implementados
[ ] PWA listo (opcional)
```

---

## 📦 Comandos de Build y Deploy

### 🔧 Build Local (Testing)
```bash
# Backend
cd backend
npm install
npm run build

# Frontend  
cd frontend
npm install
npm run build
npm run preview
```

### 🚀 Deploy Automático
```bash
# Git push dispara deploy automático
git add .
git commit -m "Ready for production"
git push origin main

# Render y Vercel deploy automáticamente
```

---

## 🔍 Monitoreo y Debugging

### 📊 Render - Logs
```bash
1. Ve a tu servicio en Render
2. "Logs" tab para ver errores
3. "Metrics" para monitoreo
4. "Events" para deploy history
```

### 📊 Vercel - Logs
```bash
1. Ve a tu proyecto en Vercel
2. "Functions" tab para logs
3. "Analytics" para métricas
4. "Deployments" para historial
```

---

## 🌐 URLs Finales de Producción

```bash
Frontend: https://biblioteca-app.vercel.app
Backend:  https://biblioteca-backend.onrender.com
API:      https://biblioteca-backend.onrender.com/api
Database: MongoDB Atlas (tu cluster)
```

---

## ⚡ Optimizaciones Adicionales

### 🚀 Backend Optimizations
```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 100 }));

// Compression
app.use(require('compression')());

// Helmet para seguridad
app.use(require('helmet')());
```

### 🎨 Frontend Optimizations
```typescript
// Lazy loading
const UserDashboard = lazy(() => import('./pages/UserDashboard'));

// Service Worker para PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

---

## 🔧 Troubleshooting Común

### ❌ CORS Issues
```javascript
// Backend - Asegúrate de configurar CORS correctamente
app.use(cors({
  origin: ['https://tu-app.vercel.app'],
  credentials: true
}));
```

### ❌ Build Errors
```bash
# Limpiar cache de Vercel
vercel --prod

# Limpiar node_modules
rm -rf node_modules package-lock.json
npm install
```

### ❌ Database Connection
```bash
# Verifica connection string
# Asegúrate de que el usuario tiene permisos
# Verifica IP whitelist en MongoDB Atlas
```

---

## 🎯 Resumen Final

1. **MongoDB Atlas**: Configurar cluster y obtener connection string
2. **Backend**: Subir a GitHub, configurar en Render con variables de entorno
3. **Frontend**: Subir a GitHub, configurar en Vercel con API URL
4. **Testing**: Probar localmente con `npm run build`
5. **Deploy**: Git push para deploy automático
6. **Monitoreo**: Usar dashboards de Render y Vercel

## 📞 Soporte

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://docs.mongodb.com/atlas

---

**¡Con esta guía tu aplicación estará lista para producción en Render + Vercel + MongoDB Atlas!** 🚀
