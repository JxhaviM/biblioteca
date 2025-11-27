# Biblioteca Digital - Documentación General

Bienvenido a la documentación del proyecto **Biblioteca Digital**. Aquí encontrarás las guías necesarias para instalar, operar y extender la aplicación.

## Contenido

1. [Guía de inicio rápido](#guía-de-inicio-rápido)
2. [Tecnologías principales](#tecnologías-principales)
3. [Estructura del repositorio](#estructura-del-repositorio)
4. [Documentos relacionados](#documentos-relacionados)
5. [Contacto y soporte](#contacto-y-soporte)

## Guía de inicio rápido

1. Clona el repositorio y asegúrate de tener **Node.js 18+** y **MongoDB 6+**.
2. Instala dependencias en la carpeta raíz:
   ```bash
   npm install
   ```
3. Configura los archivos `.env` siguiendo las variables descritas en `docs/DEPLOYMENT_GUIDE.md`.
4. Levanta los servicios en paralelo:
   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```
5. Accede a `http://localhost:5173` para usar la interfaz.

## Tecnologías principales

- **Frontend**: React 18 + TypeScript, Vite, TailwindCSS.
- **Backend**: Node.js, Express, Mongoose.
- **Base de datos**: MongoDB.
- **Autenticación**: JWT + roles (`superadmin`, `admin`, `user`).
- **Infraestructura opcional**: Docker, PM2, Nginx (ver guía de despliegue).

## Estructura del repositorio

```
backend/      # API REST, modelos, controladores, scripts de mantenimiento
frontend/     # Aplicación React, páginas, hooks y componentes
scripts/      # utilidades varias (si aplica)
docs/         # documentación técnica y funcional
```

## Documentos relacionados

- `docs/DEPLOYMENT_GUIDE.md`: Manual de despliegue y operación.
- `docs/ARCHITECTURE.md`: Visión técnica y diagramas de alto nivel.
- `docs/API_REFERENCE.md`: Referencia de endpoints y contratos.
- `docs/USER_GUIDE.md`: Manual funcional por rol.
- `docs/ROLES_PERMISSIONS.md`: Matriz de roles y permisos.
- `docs/MAINTENANCE_GUIDE.md`: Tareas de mantenimiento y scripts.
- `docs/TESTING_GUIDE.md`: Estrategia de pruebas.
- `docs/CHANGELOG.md`: Historial de cambios.
- `docs/GLOSSARY.md`: Glosario de términos clave.

## Contacto y soporte

- Equipo responsable: Área de Tecnología / Biblioteca Digital.
- Correo de soporte: soporte-biblioteca@example.com
- Reporte de incidencias: abrir issue en GitHub o escribir al correo anterior.

> **Nota:** Mantén este índice actualizado cuando agregues o modifiques documentación relevante.
