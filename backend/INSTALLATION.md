# 🚀 Guía de Instalación y Configuración - Sistema de Biblioteca

Esta guía te llevará paso a paso desde cero hasta tener el sistema completamente funcional.

## 📋 Prerrequisitos

### Software Requerido
1. **Node.js** (v18 o superior)
   - Descargar desde: https://nodejs.org/
   - Verificar instalación: `node --version`

2. **MongoDB** (v5 o superior)
   - **Opción A**: MongoDB local
     - Descargar desde: https://www.mongodb.com/download-center/community
     - Instalar MongoDB Compass (GUI opcional)
   - **Opción B**: MongoDB Atlas (en la nube)
     - Crear cuenta en: https://www.mongodb.com/atlas
     - Crear cluster gratuito

3. **Git** (para clonar el repositorio)
   - Descargar desde: https://git-scm.com/

4. **Editor de código** (recomendado)
   - Visual Studio Code: https://code.visualstudio.com/

## 🔧 Instalación Paso a Paso

### Paso 1: Clonar el Repositorio
```bash
# Clonar el proyecto
git clone https://github.com/JxhaviM/biblioteca.git

# Navegar al directorio
cd biblioteca
```

### Paso 2: Estructura del Proyecto
Después de clonar, deberías ver esta estructura:
```
biblioteca/
├── backend/           # API del servidor
├── frontend/          # Aplicación React (futuro)
├── package.json       # Configuración del monorepo
└── README.md
```

### Paso 3: Instalar Dependencias
```bash
# Desde la raíz del proyecto (instala todo)
npm run install:all

# O manualmente:
cd backend
npm install
```

### Paso 4: Configurar Base de Datos

#### Opción A: MongoDB Local
```bash
# Iniciar MongoDB (Windows)
net start MongoDB

# Iniciar MongoDB (macOS/Linux)
sudo systemctl start mongod

# Verificar que esté corriendo
mongosh --eval "db.runCommand('ping')"
```

#### Opción B: MongoDB Atlas
1. Crear cuenta en MongoDB Atlas
2. Crear nuevo cluster (gratuito)
3. Crear usuario de base de datos
4. Obtener string de conexión
5. Permitir acceso desde tu IP

### Paso 5: Configurar Variables de Entorno
```bash
# Navegar al backend
cd backend

# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus datos
```

Contenido del archivo `.env`:
```env
# MongoDB local
MONGO_URI=mongodb://localhost:27017/biblioteca

# O MongoDB Atlas
# MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/biblioteca

JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
NODE_ENV=development
PORT=5000
```

### Paso 6: Iniciar el Servidor
```bash
# Desde backend/
npm run dev
```

Si todo está bien, deberías ver:
```
🔍 Cargando rutas del sistema...
✅ authRoutes - OK
✅ bookRoutes - OK
✅ studentRoutes - OK
✅ loanRoutes - OK
✅ reportsRoutes - OK
✅ pqrRoutes - OK
✅ Todas las rutas cargadas correctamente
🚀 Servidor corriendo en el puerto 5000
MongoDB conectado: localhost
✨ Sistema de biblioteca completamente funcional!
```

### Paso 7: Verificar Instalación
```bash
# En otra terminal, probar la API
curl http://localhost:5000/api/health

# Respuesta esperada:
{
  "success": true,
  "message": "API funcionando correctamente",
  "status": "OK",
  "timestamp": "2024-09-03T...",
  "uptime": 1.234,
  "environment": "development"
}
```

## 🧪 Pruebas Básicas

### Crear un Estudiante
```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "idNumber": "2024001",
    "grade": "10°",
    "contactInfo": {
      "email": "juan@colegio.edu",
      "phone": "+1234567890"
    }
  }'
```

### Crear un Libro
```bash
curl -X POST http://localhost:5000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Don Quijote de la Mancha",
    "author": "Miguel de Cervantes",
    "isbn": "978-84-376-0494-7",
    "genre": "Novela",
    "publishedYear": 1605,
    "initialCopies": 3
  }'
```

### Crear un Préstamo
```bash
# Usar los IDs obtenidos en las respuestas anteriores
curl -X POST http://localhost:5000/api/loans \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "ID_DEL_LIBRO",
    "studentId": "ID_DEL_ESTUDIANTE"
  }'
```

## 🔍 Solución de Problemas

### Error: "Cannot connect to MongoDB"
**Problema**: No se puede conectar a la base de datos

**Soluciones**:
1. Verificar que MongoDB esté corriendo:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl status mongod
   ```

2. Verificar la URL en `.env`:
   ```env
   # MongoDB local
   MONGO_URI=mongodb://localhost:27017/biblioteca
   
   # MongoDB Atlas (ejemplo)
   MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/biblioteca
   ```

3. Para MongoDB Atlas:
   - Verificar usuario y contraseña
   - Verificar que tu IP esté en la whitelist
   - Verificar que el cluster esté activo

### Error: "Port 5000 already in use"
**Problema**: El puerto ya está siendo usado

**Soluciones**:
1. Cambiar puerto en `.env`:
   ```env
   PORT=3001
   ```

2. O matar el proceso que usa el puerto:
   ```bash
   # Windows
   netstat -ano | findstr 5000
   taskkill /PID <PID> /F
   
   # macOS/Linux
   lsof -ti:5000 | xargs kill
   ```

### Error: "Module not found"
**Problema**: Dependencias no instaladas

**Solución**:
```bash
# Limpiar e instalar todo
rm -rf node_modules package-lock.json
npm install
```

### Error: "JWT Secret not defined"
**Problema**: Variables de entorno no configuradas

**Solución**:
1. Verificar que existe el archivo `.env`
2. Verificar que `JWT_SECRET` esté definido
3. Reiniciar el servidor después de cambios en `.env`

## 📚 Datos de Prueba

### Script para Crear Datos de Ejemplo
Puedes crear un archivo `seedData.js` en la carpeta `backend`:

```javascript
// backend/seedData.js
const mongoose = require('mongoose');
require('dotenv').config();

const Book = require('./models/book');
const Student = require('./models/student');
const Loan = require('./models/loan');

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        // Limpiar datos existentes
        await Book.deleteMany({});
        await Student.deleteMany({});
        await Loan.deleteMany({});
        
        // Crear libros
        const books = await Book.create([
            {
                title: "Cien Años de Soledad",
                author: "Gabriel García Márquez",
                isbn: "978-84-376-0495-4",
                genre: "Realismo Mágico",
                publishedYear: 1967
            },
            {
                title: "Don Quijote de la Mancha",
                author: "Miguel de Cervantes",
                isbn: "978-84-376-0494-7",
                genre: "Novela",
                publishedYear: 1605
            }
        ]);
        
        // Crear estudiantes
        const students = await Student.create([
            {
                name: "Ana García",
                idNumber: "2024001",
                grade: "10°",
                contactInfo: { email: "ana@colegio.edu" }
            },
            {
                name: "Carlos López",
                idNumber: "2024002",
                grade: "11°",
                contactInfo: { email: "carlos@colegio.edu" }
            }
        ]);
        
        // Crear copias de libros
        for (let book of books) {
            for (let i = 1; i <= 3; i++) {
                await Loan.create({
                    book: book._id,
                    copyNumber: i,
                    status: 'disponible'
                });
            }
        }
        
        console.log('✅ Datos de prueba creados exitosamente');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

seedDatabase();
```

Ejecutar el script:
```bash
cd backend
node seedData.js
```

## 🚀 Siguiente Paso: Desarrollo Frontend

Una vez que tengas el backend funcionando, puedes:

1. **Usar Postman o Thunder Client** para probar la API
2. **Desarrollar el frontend** con React
3. **Integrar ambos** para la aplicación completa

### Instalar Herramientas de Desarrollo (Opcional)
```bash
# Postman para probar API
# Descargar desde: https://www.postman.com/

# O usar Thunder Client en VS Code
# Extensión: Thunder Client

# MongoDB Compass para ver la base de datos
# Descargar desde: https://www.mongodb.com/products/compass
```

## 📝 Comandos Útiles

```bash
# Iniciar en modo desarrollo
npm run dev

# Iniciar en modo producción
npm start

# Ver logs en tiempo real
npm run dev | tail -f

# Reiniciar automáticamente
# (nodemon ya incluido en npm run dev)

# Verificar estado del servidor
curl http://localhost:5000/api/health

# Ver todas las rutas disponibles
curl http://localhost:5000/api/routes
```

## 🎯 Lista de Verificación Final

- [ ] Node.js instalado (v18+)
- [ ] MongoDB corriendo (local o Atlas)
- [ ] Repositorio clonado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Variables de entorno configuradas (`.env`)
- [ ] Servidor iniciado (`npm run dev`)
- [ ] API responde (`curl localhost:5000/api/health`)
- [ ] Datos de prueba creados (opcional)

¡Listo! Tu sistema de biblioteca está completamente funcional. 🎉

Para cualquier problema, revisa la sección de solución de problemas o crea un issue en el repositorio.

---

**🔗 Enlaces Útiles:**
- [Documentación de la API](./API_DOCUMENTATION.md)
- [Arquitectura del Sistema](./ARCHITECTURE.md)
- [README Principal](./README.md)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
