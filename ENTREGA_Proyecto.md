# Sistema de Gestión de Biblioteca
## Documento de Entrega de Proyecto

**Institución Educativa:** San Pedro Claver  
**Programa:** Técnico en Programación de Software – SENA  
**Grupo:** Grado 11-02 – Promoción 2025  
**Proyecto:** Sistema de Gestión de Biblioteca Escolar  
**Instructor:** Oscar Javier Moreno

---

## 1. Introducción

El presente documento describe el **Sistema de Gestión de Biblioteca** desarrollado como proyecto de grado por los aprendices del programa **Técnico en Programación de Software – SENA**, en la **Institución Educativa San Pedro Claver**.

El objetivo principal del sistema es **apoyar y modernizar la gestión de la biblioteca escolar**, permitiendo:

- **Registro y administración de libros** (altas, bajas lógicas, edición, búsqueda y filtrado por género, estado, etc.).
- **Gestión de usuarios/autenticación** para el acceso al sistema por parte de administradores o bibliotecarios.
- **Control básico de préstamos y devoluciones**.
- **Configuración de elementos del sistema**, como información mostrada en el pie de página.
- **Visualización de reportes simples** relacionados con el uso de la biblioteca.

El proyecto utiliza una arquitectura **cliente-servidor**, con un **frontend web** que consume una **API REST** proporcionada por el backend, y una base de datos **MongoDB** alojada en la nube (MongoDB Atlas).

---

## 2. Arquitectura General del Sistema

### 2.1 Visión General

El sistema está compuesto por tres grandes bloques:

1. **Frontend (Cliente Web)**  
   - Aplicación de una sola página (SPA) desarrollada con **React** y empaquetada con **Vite**.  
   - Proporciona la interfaz gráfica para la gestión de la biblioteca.  
   - Se comunica con el backend a través de peticiones HTTP a la API REST (`/api`).  
   - Despliegue sugerido en **Vercel**.

2. **Backend (Servidor de API)**  
   - Desarrollado con **Node.js** y **Express** (o framework equivalente).  
   - Expone endpoints REST para la gestión de libros, géneros, usuarios, préstamos, configuración del sistema, etc.  
   - Implementa reglas de negocio, validación y seguridad básica (por ejemplo, autenticación mediante tokens).  
   - Conecta con la base de datos MongoDB mediante un URI de conexión.  
   - Despliegue sugerido en **Render**.

3. **Base de Datos (MongoDB Atlas)**  
   - Base de datos NoSQL en un **cluster** de MongoDB Atlas.  
   - Permite almacenamiento persistente y seguro de los datos de la biblioteca.  
   - Accedido únicamente por el backend mediante la cadena de conexión (`MONGODB_URI`).

### 2.2 Diagrama Lógico (Descripción)

- El **usuario** accede al sistema desde un navegador web (PC, portátil, etc.).  
- Se conecta a la **aplicación frontend** (Vercel o servidor local) mediante HTTP/HTTPS.  
- El frontend envía peticiones a la **API REST del backend** (Render o servidor local).  
- El backend procesa la petición, realiza validaciones y accede a la **base de datos MongoDB**.  
- Los datos se devuelven al frontend, que los muestra al usuario en la interfaz de la biblioteca.

---

## 3. Estructura del Repositorio

La organización del repositorio del proyecto es la siguiente (puede variar levemente según la versión final, pero respeta esta estructura general):

```text
biblioteca/
├─ backend/                # Código fuente del servidor (API REST)
│  ├─ src/
│  │  ├─ routes/           # Definición de rutas /api (libros, géneros, auth, sistema, etc.)
│  │  ├─ controllers/      # Controladores con la lógica de negocio
│  │  ├─ models/           # Modelos de datos (Mongoose / MongoDB)
│  │  ├─ middlewares/      # Middlewares de autenticación, validación, logs, etc.
│  │  └─ server.ts|js      # Punto de entrada del servidor
│  ├─ package.json
│  ├─ tsconfig.json        # (si se usa TypeScript)
│  └─ .env.example         # Ejemplo de variables de entorno (sin credenciales reales)
│
├─ frontend/               # Código fuente del cliente web (React + Vite)
│  ├─ src/
│  │  ├─ api/              # Clientes de API (auth, books, system, etc.)
│  │  ├─ components/       # Componentes reutilizables (tablas, formularios, layout, etc.)
│  │  ├─ pages/            # Páginas principales (Libros, Login, Dashboard, etc.)
│  │  ├─ hooks/            # Hooks personalizados (manejo de estado, peticiones, etc.)
│  │  ├─ router/           # Configuración de rutas del frontend
│  │  ├─ styles/           # Estilos globales o específicos
│  │  └─ main.tsx          # Punto de entrada de React
│  ├─ vite.config.ts       # Configuración de Vite y proxy local hacia /api
│  ├─ package.json
│  └─ .env.example         # Ejemplo de variables de entorno del frontend
│
└─ ENTREGA_Proyecto.md     # Documento de entrega (este archivo)
```

---

## 4. Módulos Funcionales del Sistema

### 4.1 Módulo de Autenticación y Usuarios

- **Objetivo:** Controlar el acceso al sistema.  
- **Funcionalidades principales:**
  - Inicio de sesión mediante usuario/contraseña.  
  - Emisión y validación de tokens (por ejemplo, JWT).  
  - Restricción de ciertas secciones del sistema solo a usuarios autenticados.

### 4.2 Módulo de Libros

- **Objetivo:** Gestionar el catálogo de libros de la biblioteca.  
- **Funcionalidades principales:**
  - Registro de nuevos libros con sus datos principales (título, autor, género, código, etc.).  
  - Edición de la información de libros existentes.  
  - Marcado de libros como activos/inactivos (baja lógica).  
  - Búsqueda y filtrado por título, autor, género, estado, etc.  
  - Listado paginado de libros.

### 4.3 Módulo de Géneros / Categorías

- **Objetivo:** Clasificar los libros por géneros o categorías.  
- **Funcionalidades principales:**
  - Registro y edición de géneros.  
  - Listado de géneros activos.  
  - Asociación de libros a uno o varios géneros.

### 4.4 Módulo de Préstamos y Devoluciones (si aplica)

- **Objetivo:** Registrar la salida y devolución de libros.  
- **Funcionalidades principales:**
  - Registro de un préstamo (fecha, usuario, libro).  
  - Registro de devolución.  
  - Control básico de estado del libro (prestado/disponible).  
  - Consulta de historial básico de préstamos.

### 4.5 Módulo de Configuración del Sistema

- **Objetivo:** Administrar ciertos parámetros globales del sistema.  
- **Funcionalidades principales:**
  - Configuración de textos informativos (por ejemplo, pie de página).  
  - Parámetros generales visibles en la interfaz.

---

## 5. Requisitos Previos

Para la ejecución y despliegue del sistema se requieren, como mínimo:

- **Node.js** (versión recomendada: 18 o superior).  
- **npm** (gestor de paquetes de Node).  
- **Cuenta en MongoDB Atlas** para disponer de un cluster en la nube.  
- **Cuenta en Render** para el despliegue del backend.  
- **Cuenta en Vercel** para el despliegue del frontend.  
- **Navegador web** actualizado (Chrome, Edge, Firefox, etc.).

---

## 6. Configuración de Variables de Entorno

### 6.1 Backend

En el directorio `backend/`, crear un archivo `.env` (no se debe subir al repositorio) con variables similares a:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster-url>/biblioteca_db?retryWrites=true&w=majority

JWT_SECRET=una_clave_secreta_segura
CORS_ORIGIN=http://localhost:3000
```

- `PORT`: puerto donde escuchará la API (en local se usa comúnmente `5000`).  
- `MONGODB_URI`: cadena de conexión al cluster de MongoDB Atlas.  
- `JWT_SECRET`: clave secreta para generación/validación de tokens.  
- `CORS_ORIGIN`: origen permitido para peticiones desde el frontend.

En producción (Render), estos valores se configuran en el panel de variables de entorno del servicio.

### 6.2 Frontend

En el directorio `frontend/`, crear un archivo `.env` con, por ejemplo:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

En producción (Vercel), `VITE_API_BASE_URL` debe apuntar a la URL pública del backend en Render, por ejemplo:

```env
VITE_API_BASE_URL=https://nombre-del-backend.onrender.com/api
```

---

## 7. Guía de Despliegue en Entorno Local

### 7.1 Clonado del Repositorio (si aplica)

```bash
git clone <URL_DEL_REPOSITORIO>
cd biblioteca
```

### 7.2 Instalación y Ejecución del Backend en Local

En una terminal:

```bash
cd backend
npm install
# Crear .env según la sección de variables de entorno
npm run dev    # o npm start, según la configuración del proyecto
```

- La API quedará disponible en: `http://localhost:5000/api`.

### 7.3 Instalación y Ejecución del Frontend en Local

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

- El frontend quedará disponible en: `http://localhost:3000`.

### 7.4 Acceso como "Puerto de Enlace" en Red Local

Gracias a la configuración del servidor de desarrollo (por ejemplo, host `0.0.0.0`), otros equipos de la red local pueden acceder al sistema usando la IP del equipo que está ejecutando el frontend:

- Desde el mismo equipo:  
  `http://localhost:3000`

- Desde otro equipo de la red:  
  `http://IP_DEL_SERVIDOR:3000` (por ejemplo, `http://192.168.1.10:3000`).

De esta forma, el puerto **3000** actúa como **puerto de enlace** para el acceso local al sistema desde varios equipos.

---

## 8. Despliegue del Backend en Render

### 8.1 Creación del Servicio en Render

1. Ingresar a [https://render.com](https://render.com).  
2. Crear una cuenta o iniciar sesión.  
3. Seleccionar **New > Web Service**.  
4. Conectar el repositorio de Git donde se encuentra el proyecto.  
5. Elegir la rama y apuntar al directorio del backend (si es necesario).  
6. Definir el **Environment** como Node.

### 8.2 Comandos de Build y Start

- **Build Command** (ejemplo):

  ```bash
  npm install
  npm run build   # si se usa TypeScript o un paso de compilación
  ```

- **Start Command** (ejemplo):

  ```bash
  npm run start   # o node dist/server.js, según la configuración real
  ```

### 8.3 Variables de Entorno en Render

En la sección de **Environment Variables** del servicio en Render, configurar:

```text
PORT=10000                            # Render suele gestionar el puerto, pero se usa PORT
MONGODB_URI=<cadena_de_conexion_Atlas>
JWT_SECRET=<clave_secreta_produccion>
CORS_ORIGIN=https://<URL_FRONTEND_VERCL>.vercel.app
```

Una vez desplegado, Render generará una URL pública similar a:

```text
https://nombre-del-backend.onrender.com
```

La API pública estará disponible en:

```text
https://nombre-del-backend.onrender.com/api
```

---

## 9. Despliegue del Frontend en Vercel

### 9.1 Creación del Proyecto en Vercel

1. Ingresar a [https://vercel.com](https://vercel.com).  
2. Iniciar sesión/c
y crear un **New Project**.  
3. Importar el repositorio desde Git (GitHub, GitLab, etc.).  
4. Configurar la **Root Directory** como `frontend/`.

### 9.2 Configuración del Build

- **Framework Preset**: React / Vite.  
- **Build Command**: `npm run build`.  
- **Output Directory**: `dist`.

### 9.3 Variables de Entorno en Vercel

En **Project Settings > Environment Variables**, agregar:

```text
VITE_API_BASE_URL=https://nombre-del-backend.onrender.com/api
```

Luego, desplegar nuevamente el proyecto para que el frontend use correctamente la URL del backend en Render.

### 9.4 URL de Producción

Vercel proporcionará una URL similar a:

```text
https://nombre-del-frontend.vercel.app
```

Esta será la URL de acceso público al Sistema de Gestión de Biblioteca.

---

## 10. Configuración de la Base de Datos en un Cluster de MongoDB Atlas

### 10.1 Creación del Cluster

1. Ingresar a [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas).  
2. Crear una cuenta o iniciar sesión.  
3. Crear un **Cluster** (plan gratuito o plan según lo requerido).  
4. Definir la región/servidor según la disponibilidad.  
5. Crear un usuario de base de datos, por ejemplo:  
   - Usuario: `<usuario>`  
   - Contraseña: `<password>`

### 10.2 Creación de la Base de Datos y Colecciones

1. En el cluster, ir a **Database > Browse Collections**.  
2. Crear una base de datos, por ejemplo: `biblioteca_db`.  
3. Crear las colecciones necesarias, por ejemplo:  
   - `users`  
   - `books`  
   - `genres`  
   - `loans`  
   - `system_config`

4. Configurar índices según sea necesario (por ejemplo, en `books` para búsquedas por título o género).

### 10.3 Configuración de Acceso de Red

En la sección **Network Access**:

- Agregar la IP o rango de IPs que pueden conectarse al cluster, por ejemplo:  
  - IP del servidor de Render.  
  - IP pública de la red de desarrollo.  
- Evitar, en lo posible, permitir acceso desde cualquier IP (`0.0.0.0/0`) a menos que se comprenda el riesgo de seguridad.

### 10.4 Obtención del URI de Conexión

1. En el cluster, seleccionar **Connect**.  
2. Elegir la opción **Connect your application**.  
3. Copiar la cadena de conexión (tipo `mongodb+srv://...`).  
4. Usarla en el backend como valor de `MONGODB_URI` en las variables de entorno.

---

## 11. Consideraciones de Seguridad y Buenas Prácticas

- No subir a repositorios públicos información sensible (claves, contraseñas, URIs completas con usuario/contraseña, etc.).  
- Utilizar siempre archivos `.env` locales y variables de entorno en Render/Vercel para credenciales.  
- Restringir el CORS únicamente a los dominios necesarios (dominio de Vercel y `localhost`).  
- Mantener las dependencias del proyecto actualizadas.  
- Realizar copias de seguridad regulares de la base de datos.

---

## 12. Créditos y Datos Institucionales

### 12.1 Institución

- **Institución Educativa:** San Pedro Claver  
- **Programa:** Técnico en Programación de Software – SENA  
- **Grupo:** Grado 11-02 – Promoción 2025  
- **Proyecto:** Sistema de Gestión de Biblioteca Escolar  
- **Instructor:** Oscar Javier Moreno

### 12.2 Integrantes del Proyecto

- **Maira Salome Blandón Quintero** – TI 1027807171  
- **Miriam Aleisha García Siervo** – CC 1056772656  
- **Franco Nemocón Muñoz** – TI 1056774761  
- **Santiago Hortua Aguirre** – TI 1056774952  
- **Sergio Santiago Tilano Jaramillo** – TI 1056775413  
- **Nathalia Mazo Fernández** – TI 1054554383  
- **Samuel Aranda Cuesta** – TI 1034781878  
- **Nicolas Moreno Meriño** – TI 1133940216  
- **Alizon Camila Ardila Peñaloza** – TI 1056775120  
- **Ana María Pinto Vélez** – CC 1129624228  
- **Julián Ernesto Galeano Obando** – TI 1056773490  
- **Juan Esteban Navarro Monsalve** – TI 1057095962

---

## 13. Estado Actual del Proyecto

- **Frontend:** desarrollado en React + Vite, con build de producción funcional y preparado para despliegue en Vercel.  
- **Backend:** API construida en Node.js/Express (o similar), lista para desplegar en Render configurando las variables de entorno.  
- **Base de datos:** diseñada para ejecutarse en un cluster de MongoDB Atlas, con colecciones orientadas a la gestión de usuarios, libros, géneros, préstamos y configuración del sistema.

Este documento sirve como **README de entrega** y como guía para la **instalación**, **ejecución local** y **despliegue en la nube** del Sistema de Gestión de Biblioteca de la Institución Educativa San Pedro Claver, Programa Técnico en Programación de Software – SENA, promoción 2025.
