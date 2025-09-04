# 📚 Sistema de Biblioteca - Backend

Sistema completo de gestión de biblioteca desarrollado con **Node.js**, **Express** y **MongoDB**. Permite gestionar libros, estudiantes, préstamos y generar reportes avanzados con funcionalidades inteligentes.

## 🌟 Características Principales - MVP v1.0

### 📖 Gestión de Libros
- ✅ CRUD completo de libros
- ✅ Sistema de múltiples copias por libro
- ✅ Búsqueda avanzada con filtros múltiples
- ✅ Importación masiva de libros
- ✅ Control de disponibilidad en tiempo real

### 👥 Gestión de Estudiantes
- ✅ Registro y gestión de estudiantes
- ✅ Historial completo de préstamos
- ✅ Estadísticas personalizadas por estudiante
- ✅ Sistema de contacto y notas

### 📝 Sistema de Préstamos Inteligente
- ✅ **6 Estados automatizados**: prestado, devuelto, atrasado, renovado, perdido, dañado
- ✅ **Renovaciones limitadas** con validaciones inteligentes
- ✅ **Asignación automática** de copias disponibles
- ✅ **Actualización automática** de estados vencidos
- ✅ **Tipos de préstamo**: normal (7d), extendido (14d), especial

### 📊 Reportes y Analytics
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Reportes de libros más populares
- ✅ Estudiantes más activos
- ✅ Préstamos por período personalizable
- ✅ Mantenimiento automático de base de datos

### 🔐 Seguridad
- ✅ Autenticación JWT
- ✅ Middleware de validación
- ✅ Manejo de errores robusto
- ✅ Sanitización de datos

## 🚀 Instalación y Configuración

### Prerrequisitos
- **Node.js** v18+ 
- **MongoDB** v5+
- **npm** v8+

### 1. Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd biblioteca/backend

# Instalar dependencias
npm install
```

### 2. Variables de Entorno
Crear archivo `.env` en la carpeta `backend`:
```env
MONGO_URI=mongodb://localhost:27017/biblioteca
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
NODE_ENV=development
PORT=5000
```

### 3. Ejecutar el Servidor
```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

### 4. Verificar Instalación
```bash
# Health check
curl http://localhost:5000/api/health
```

## 📁 Estructura del Proyecto

```
backend/
├── config/
│   └── db.js                 # Configuración MongoDB
├── controllers/
│   ├── authController.js     # Autenticación
│   ├── bookController.js     # Gestión de libros
│   ├── studentController.js  # Gestión de estudiantes
│   ├── loanController.js     # Sistema de préstamos
│   ├── reportsController.js  # Reportes y estadísticas
│   └── pqrController.js      # 🔄 PQR (v1.1 - Futuro)
├── middlewares/
│   ├── authMiddleware.js     # Autenticación JWT
│   └── loanMiddleware.js     # Actualización automática
├── models/
│   ├── book.js              # Modelo de libros
│   ├── student.js           # Modelo de estudiantes
│   ├── loan.js              # Modelo de préstamos
│   ├── user.js              # Modelo de usuarios
│   └── pqr.js               # 🔄 Modelo PQR (v1.1 - Futuro)s
├── routes/
│   ├── authRoutes.js        # Rutas de autenticación
│   ├── bookRoutes.js        # Rutas de libros
│   ├── studentRoutes.js     # Rutas de estudiantes
│   ├── loanRoutes.js        # Rutas de préstamos
│   ├── reportsRoutes.js     # Rutas de reportes
│   └── pqrRoutes.js         # 🔄 Rutas PQR (v1.1 - Futuro)s
├── services/
│   └── schedulerService.js  # Tareas programadas
├── .env                     # Variables de entorno
├── server.js                # Servidor principal
└── package.json
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo con recarga automática
npm run dev

# Producción
npm start

# Instalación completa del monorepo (desde raíz)
npm run install:all

# Build completo (desde raíz)
npm run build

# Limpiar node_modules (desde raíz)
npm run clean
```

## 📊 Modelos de Datos

### 📖 Book
```javascript
{
  title: String,          // Título del libro
  author: String,         // Autor
  isbn: String,           // ISBN único
  genre: String,          // Género literario
  publishedYear: Number,  // Año de publicación
  location: String,       // Ubicación física
  description: String,    // Descripción
  language: String,       // Idioma
  publisher: String,      // Editorial
  pages: Number,          // Número de páginas
  isActive: Boolean,      // Estado activo/inactivo
  createdAt: Date,        // Fecha de creación
  updatedAt: Date         // Última actualización
}
```

### 👤 Student
```javascript
{
  name: String,           // Nombre completo
  idNumber: String,       // Número de identificación único
  grade: String,          // Grado o curso
  contactInfo: {          // Información de contacto
    email: String,
    phone: String,
    address: String
  },
  notes: String,          // Notas adicionales
  isActive: Boolean,      // Estado activo/inactivo
  createdAt: Date,
  updatedAt: Date
}
```

### 📝 Loan
```javascript
{
  book: ObjectId,         // Referencia al libro
  student: ObjectId,      // Referencia al estudiante
  copyNumber: Number,     // Número de copia específica
  loanDate: Date,         // Fecha de préstamo
  dueDate: Date,          // Fecha de vencimiento
  returnDate: Date,       // Fecha de devolución
  status: String,         // prestado|devuelto|atrasado|renovado|perdido|danado
  renewalCount: Number,   // Número de renovaciones
  renewalHistory: [],     // Historial de renovaciones
  loanedBy: String,       // Quien registró el préstamo
  returnedBy: String,     // Quien registró la devolución
  loanType: String,       // normal|extended|special
  notes: String,          // Notas adicionales
  condition: String       // Estado del libro al devolverlo
}
```

## 🌐 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión

### Libros
- `GET /api/books` - Listar libros con paginación
- `GET /api/books/search` - Búsqueda avanzada
- `GET /api/books/:id` - Obtener libro específico
- `GET /api/books/:id/availability` - Disponibilidad en tiempo real
- `POST /api/books` - Crear libro
- `POST /api/books/bulk` - Importación masiva
- `PUT /api/books/:id` - Actualizar libro
- `DELETE /api/books/:id` - Eliminar (soft delete)

### Estudiantes
- `GET /api/students` - Listar estudiantes
- `GET /api/students/:id` - Obtener estudiante
- `GET /api/students/:id/stats` - Estadísticas del estudiante
- `GET /api/students/:id/loans` - Historial de préstamos
- `POST /api/students` - Crear estudiante
- `PUT /api/students/:id` - Actualizar estudiante
- `DELETE /api/students/:id` - Eliminar estudiante

### Préstamos
- `GET /api/loans` - Historial de préstamos
- `GET /api/loans/overdue` - Préstamos atrasados
- `GET /api/loans/student/:id` - Préstamos por estudiante
- `POST /api/loans` - Crear préstamo
- `POST /api/loans/create-copies` - Crear copias adicionales
- `PUT /api/loans/:id/return` - Devolver libro
- `PUT /api/loans/:id/renew` - Renovar préstamo

### Reportes
- `GET /api/reports/dashboard` - Dashboard principal
- `GET /api/reports/loans` - Reporte de préstamos
- `GET /api/reports/popular-books` - Libros populares
- `GET /api/reports/active-students` - Estudiantes activos
- `POST /api/reports/maintenance` - Mantenimiento DB

### Sistema
- `GET /api/health` - Estado del servidor

## 🔧 Características Técnicas

### Middleware Automático
- **updateLoanStatuses**: Actualiza automáticamente estados vencidos
- **Autenticación JWT**: Protección de rutas (configurable)
- **Validación**: Sanitización y validación de datos
- **CORS**: Configurado para desarrollo

### Base de Datos
- **MongoDB** con **Mongoose ODM**
- **Índices optimizados** para búsquedas rápidas
- **Validaciones** a nivel de esquema
- **Soft deletes** para integridad histórica

### Funcionalidades Inteligentes
- ✅ **Asignación automática** de copias disponibles
- ✅ **Detección automática** de préstamos vencidos
- ✅ **Límites inteligentes** de renovaciones
- ✅ **Búsqueda fuzzy** en múltiples campos
- ✅ **Agregaciones complejas** para reportes
- ✅ **Paginación optimizada**

## 🧪 Testing y Desarrollo

### Probar Endpoints
```bash
# Health check
curl http://localhost:5000/api/health

# Crear estudiante
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Pérez","idNumber":"2024001","grade":"10°"}'

# Crear libro
curl -X POST http://localhost:5000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Don Quijote","author":"Cervantes","isbn":"123456","initialCopies":3}'
```

### Logs y Debugging
- Logs detallados en consola
- Variables de entorno para debug
- Manejo de errores con stack traces
- Middleware de logging con Morgan

## 🚀 Próximas Funcionalidades

### 🔄 En Desarrollo (v1.1)
- [ ] **Sistema PQR completo** - Peticiones, quejas y reclamos
- [ ] **Notificaciones automáticas** por email/SMS
- [ ] **Dashboard administrativo** avanzado
- [ ] **API de multas** y penalizaciones

### 📋 Planificadas (v1.2+)
- [ ] Sistema de notificaciones automáticas
- [ ] API de multas y penalizaciones  
- [ ] Integración con códigos QR/Barcode
- [ ] Sistema de reservas de libros
- [ ] Dashboard web administrativo
- [ ] Exportación de reportes a PDF/Excel

### Mejoras Planeadas
- [ ] Sistema de notificaciones automáticas
- [ ] API de multas y penalizaciones  
- [ ] Integración con códigos QR/Barcode
- [ ] Sistema de reservas de libros
- [ ] Dashboard web administrativo
- [ ] Exportación de reportes a PDF/Excel

### Mejoras Planeadas
- [ ] Autenticación con roles granulares
- [ ] Cache con Redis para mejor performance
- [ ] Logs estructurados con Winston
- [ ] Tests automatizados con Jest
- [ ] Documentación con Swagger/OpenAPI
- [ ] Docker para deployment

## 🤝 Contribución

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Autores

- **Desarrollador Principal** - [@JxhaviM](https://github.com/JxhaviM)

## 📞 Soporte

Para reportar bugs o solicitar features:
- 🐛 **Issues**: [GitHub Issues](https://github.com/JxhaviM/biblioteca/issues)
- 📧 **Email**: soporte@biblioteca.com
- 📖 **Documentación**: Ver `API_DOCUMENTATION.md`

---

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!**

> Última actualización: Septiembre 2025 | Versión: 1.0.0
