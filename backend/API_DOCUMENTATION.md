# Sistema de Biblioteca - Documentación API

## 📚 Descripción General

Sistema completo de gestión de biblioteca desarrollado con Node.js, Express y MongoDB. Permite gestionar libros, estudiantes, préstamos y generar reportes avanzados.

## 🚀 Inicio Rápido

### Instalación
```bash
cd backend
npm install
```

### Variables de Entorno (.env)
```
MONGO_URI=mongodb://localhost:27017/biblioteca
JWT_SECRET=tu_jwt_secret_key
NODE_ENV=development
PORT=5000
```

### Ejecutar el Servidor
```bash
npm run dev    # Modo desarrollo con nodemon
npm start      # Modo producción
```

### Endpoints Base
- **Servidor**: `http://localhost:5000`
- **Health Check**: `GET /api/health`

---

## 🔐 Autenticación

### Base URL: `/api/auth`

#### Registrar Usuario
```http
POST /api/auth/register
Content-Type: application/json

{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "123456",
    "role": "admin" // opcional, default: "user"
}
```

#### Iniciar Sesión
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "juan@example.com",
    "password": "123456"
}
```

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Login exitoso",
    "token": "jwt_token_here",
    "user": {
        "id": "user_id",
        "name": "Juan Pérez",
        "email": "juan@example.com",
        "role": "admin"
    }
}
```

---

## 📖 Gestión de Libros

### Base URL: `/api/books`

#### Obtener Todos los Libros
```http
GET /api/books
Query Parameters:
- page: Número de página (default: 1)
- limit: Libros por página (default: 50)
- search: Búsqueda en título, autor o ISBN
- genre: Filtrar por género
- isActive: true/false (default: true)
```

#### Buscar Libros (Avanzado)
```http
GET /api/books/search
Query Parameters:
- search: Término de búsqueda general
- author: Filtrar por autor
- genre: Filtrar por género
- publishedYear: Año de publicación
- available: true/false - Solo libros disponibles
- page: Número de página
- limit: Resultados por página
```

#### Obtener Libro por ID
```http
GET /api/books/:id
```

#### Obtener Disponibilidad de un Libro
```http
GET /api/books/:id/availability
```

**Respuesta:**
```json
{
    "success": true,
    "availability": {
        "bookId": "book_id",
        "title": "Título del Libro",
        "totalCopies": 5,
        "availableCopies": 3,
        "loanedCopies": 2,
        "availableCopyNumbers": [1, 3, 5],
        "loanedCopies": [
            {
                "copyNumber": 2,
                "studentName": "María García",
                "dueDate": "2024-09-10T00:00:00.000Z"
            }
        ]
    }
}
```

#### Crear Libro
```http
POST /api/books
Content-Type: application/json

{
    "title": "El Quijote",
    "author": "Miguel de Cervantes",
    "isbn": "978-84-376-0494-7",
    "genre": "Novela",
    "publishedYear": 1605,
    "location": "Estante A-1",
    "description": "Descripción del libro",
    "language": "Español",
    "publisher": "Editorial Example",
    "pages": 500,
    "initialCopies": 3
}
```

#### Crear Múltiples Libros (Importación Masiva)
```http
POST /api/books/bulk
Content-Type: application/json

[
    {
        "title": "Libro 1",
        "author": "Autor 1",
        "isbn": "123456789",
        "genre": "Ficción",
        "publishedYear": 2020,
        "location": "A-1",
        "initialCopies": 2
    }
]
```

#### Actualizar Libro
```http
PUT /api/books/:id
Content-Type: application/json

{
    "title": "Nuevo título",
    "author": "Nuevo autor"
}
```

#### Eliminar Libro (Soft Delete)
```http
DELETE /api/books/:id
```

---

## 👥 Gestión de Estudiantes

### Base URL: `/api/students`

#### Obtener Todos los Estudiantes
```http
GET /api/students
Query Parameters:
- page: Número de página
- limit: Estudiantes por página
- search: Búsqueda en nombre o número de identificación
- grade: Filtrar por grado
- isActive: true/false
```

#### Obtener Estudiante por ID
```http
GET /api/students/:id
```

#### Obtener Estadísticas de Estudiante
```http
GET /api/students/:id/stats
```

**Respuesta:**
```json
{
    "success": true,
    "stats": {
        "totalLoans": 15,
        "currentLoans": 2,
        "overdueLoans": 0,
        "averageLoanDuration": 7.5,
        "favoriteGenres": ["Ficción", "Historia"],
        "punctualityScore": 95
    }
}
```

#### Obtener Historial de Préstamos
```http
GET /api/students/:id/loans
Query Parameters:
- page: Número de página
- limit: Préstamos por página
- status: prestado, devuelto, atrasado, renovado
```

#### Crear Estudiante
```http
POST /api/students
Content-Type: application/json

{
    "name": "Ana García",
    "idNumber": "20231001",
    "grade": "10°",
    "contactInfo": {
        "email": "ana@colegio.edu",
        "phone": "+1234567890",
        "address": "Calle 123, Ciudad"
    },
    "notes": "Estudiante destacada"
}
```

#### Actualizar Estudiante
```http
PUT /api/students/:id
Content-Type: application/json

{
    "grade": "11°",
    "contactInfo": {
        "phone": "+0987654321"
    }
}
```

#### Eliminar Estudiante (Soft Delete)
```http
DELETE /api/students/:id
```

---

## 📝 Sistema de Préstamos

### Base URL: `/api/loans`

#### Obtener Historial de Préstamos
```http
GET /api/loans
Query Parameters:
- page: Número de página
- limit: Préstamos por página
- status: prestado, devuelto, atrasado, renovado
- startDate: Fecha inicio (YYYY-MM-DD)
- endDate: Fecha fin (YYYY-MM-DD)
- bookId: ID del libro
- studentId: ID del estudiante
```

#### Obtener Préstamos por Estudiante
```http
GET /api/loans/student/:studentId
Query Parameters:
- status: Filtrar por estado
- page: Número de página
- limit: Préstamos por página
```

#### Obtener Préstamos Atrasados
```http
GET /api/loans/overdue
Query Parameters:
- page: Número de página
- limit: Préstamos por página
```

#### Crear Préstamo
```http
POST /api/loans
Content-Type: application/json

{
    "bookId": "book_id_here",
    "studentId": "student_id_here",
    "copyNumber": 1, // opcional, se asigna automáticamente
    "dueDate": "2024-09-15", // opcional, default: 7 días
    "loanedBy": "Bibliotecario",
    "loanType": "normal" // normal, extended, special
}
```

#### Devolver Libro
```http
PUT /api/loans/:id/return
Content-Type: application/json

{
    "returnedBy": "Bibliotecario",
    "notes": "Libro en buen estado",
    "condition": "good" // excellent, good, fair, poor
}
```

#### Renovar/Posponer Préstamo
```http
PUT /api/loans/:id/renew
Content-Type: application/json

{
    "additionalDays": 7,
    "reason": "Necesita más tiempo para terminar"
}
```

#### Crear Múltiples Copias de un Libro
```http
POST /api/loans/create-copies
Content-Type: application/json

{
    "bookId": "book_id_here",
    "numberOfCopies": 3
}
```

---

## 📊 Reportes y Estadísticas

### Base URL: `/api/reports`

#### Dashboard General
```http
GET /api/reports/dashboard
```

**Respuesta:**
```json
{
    "success": true,
    "dashboard": {
        "totalBooks": 150,
        "totalStudents": 45,
        "activeLoans": 23,
        "overdueLoans": 2,
        "availableBooks": 127,
        "popularGenres": ["Ficción", "Historia", "Ciencia"],
        "recentActivity": [...]
    }
}
```

#### Reporte de Préstamos por Período
```http
GET /api/reports/loans
Query Parameters:
- startDate: Fecha inicio (YYYY-MM-DD)
- endDate: Fecha fin (YYYY-MM-DD)
- format: json, summary
```

#### Libros Más Populares
```http
GET /api/reports/popular-books
Query Parameters:
- period: Días hacia atrás (default: 30)
- limit: Número de libros (default: 20)
```

#### Estudiantes Más Activos
```http
GET /api/reports/active-students
Query Parameters:
- period: Días hacia atrás (default: 30)
- limit: Número de estudiantes (default: 20)
```

#### Ejecutar Mantenimiento de Base de Datos
```http
POST /api/reports/maintenance
```

#### Generar Reporte Automático
```http
GET /api/reports/automatic
```

---

## 🎫 PQRs (Peticiones, Quejas y Reclamos) 🔄 **[COMING SOON v1.1]**

> **Estado**: 📋 Documentado | 🔄 No implementado  
> **Disponibilidad**: Próxima versión v1.1  
> **Prioridad**: Media (Post-MVP feedback)

*El sistema PQR permitirá a estudiantes y administradores gestionar peticiones, quejas y reclamos de manera organizada. Esta funcionalidad está completamente diseñada y lista para implementar en la siguiente iteración.*

### Base URL: `/api/pqrs` *(Próximamente)*

#### Obtener Todas las PQRs *(Futuro)*
```http
GET /api/pqrs
```

#### Crear PQR *(Futuro)*
```http
POST /api/pqrs
Content-Type: application/json

{
    "title": "Problema con libro dañado",
    "description": "El libro llegó con páginas rotas",
    "type": "complaint", // request, complaint, claim
    "studentId": "student_id", // opcional
    "priority": "medium" // low, medium, high
}
```

**📋 Funcionalidades Planificadas:**
- ✅ CRUD completo de PQRs
- ✅ Categorización por tipos (petición, queja, reclamo)
- ✅ Sistema de prioridades
- ✅ Seguimiento de estado
- ✅ Respuestas y resoluciones
- ✅ Reportes de PQRs por período
- ✅ Notificaciones automáticas

---

## 🔧 Estados del Sistema

### Estados de Préstamos
- **prestado**: Libro actualmente prestado
- **devuelto**: Libro devuelto exitosamente
- **atrasado**: Préstamo vencido
- **renovado**: Préstamo extendido
- **perdido**: Libro reportado como perdido
- **danado**: Libro devuelto con daños

### Tipos de Préstamo
- **normal**: Préstamo estándar (7 días)
- **extended**: Préstamo extendido (14 días)
- **special**: Préstamo especial (personalizado)

### Condiciones de Libros
- **excellent**: Excelente estado
- **good**: Buen estado
- **fair**: Estado regular
- **poor**: Mal estado

---

## 🔒 Seguridad y Middleware

### Autenticación JWT
- Token incluido en header: `Authorization: Bearer <token>`
- Middleware de autenticación (comentado por ahora, se puede activar)

### Middleware Automático
- **updateLoanStatuses**: Actualiza automáticamente estados de préstamos vencidos
- Se ejecuta en rutas de students, loans y reports

### Validaciones
- Validación de datos con Mongoose schemas
- Manejo de errores personalizado
- Sanitización de entradas

---

## 🚀 Características Avanzadas

### Sistema de Copias Múltiples
- Cada libro puede tener múltiples copias
- Asignación automática de números de copia
- Disponibilidad en tiempo real

### Renovaciones Inteligentes
- Límite de renovaciones por préstamo
- Validación de disponibilidad antes de renovar
- Historial completo de renovaciones

### Reportes Automatizados
- Mantenimiento programado de base de datos
- Actualización automática de estados
- Generación de estadísticas en tiempo real

### Búsqueda Avanzada
- Búsqueda por texto completo
- Filtros múltiples combinables
- Paginación optimizada

---

## 📝 Códigos de Error

### Errores Comunes
- **400**: Datos de entrada inválidos
- **401**: No autorizado
- **404**: Recurso no encontrado
- **409**: Conflicto (ej: libro ya prestado)
- **500**: Error interno del servidor

### Formato de Error
```json
{
    "success": false,
    "message": "Descripción del error",
    "errors": ["Error específico 1", "Error específico 2"]
}
```

---

## 🧪 Testing

### Health Check
```http
GET /api/health
```

### Ejemplo de Flujo Completo
1. Crear estudiante
2. Crear libro con copias
3. Crear préstamo
4. Verificar disponibilidad
5. Renovar préstamo
6. Devolver libro
7. Generar reporte

---

**Última actualización**: Septiembre 2025  
**Versión del API**: 1.0.0  
**Tecnologías**: Node.js, Express, MongoDB, Mongoose, JWT
