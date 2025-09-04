# 🏗️ Arquitectura del Sistema - Biblioteca

## 📊 Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React + Vite)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │   Login     │  │   Books     │  │  Students   │  │   Reports    │ │
│  │   Page      │  │   Page      │  │    Page     │  │     Page     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘ │
│           │                │                │               │        │
└───────────┼────────────────┼────────────────┼───────────────┼────────┘
            │                │                │               │
            │            HTTP/HTTPS REST API (Port 5000)      │
            │                │                │               │
┌───────────┼────────────────┼────────────────┼───────────────┼────────┐
│                          BACKEND (Node.js + Express)               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      MIDDLEWARE LAYER                          │ │
│  │  ┌──────────┐  ┌─────────────┐  ┌─────────┐  ┌─────────────────┐ │ │
│  │  │   CORS   │  │    Auth     │  │  Loan   │  │   Error         │ │ │
│  │  │ Handler  │  │ Middleware  │  │ Status  │  │   Handler       │ │ │
│  │  │          │  │    (JWT)    │  │ Update  │  │                 │ │ │
│  │  └──────────┘  └─────────────┘  └─────────┘  └─────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                        ROUTES LAYER                            │ │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────┐ ┌─────────────┐ │ │
│  │  │  Auth   │ │  Books  │ │ Students │ │ Loans │ │   Reports   │ │ │
│  │  │ Routes  │ │ Routes  │ │  Routes  │ │Routes │ │   Routes    │ │ │
│  │  └─────────┘ └─────────┘ └──────────┘ └───────┘ └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     CONTROLLERS LAYER                          │ │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────┐ ┌─────────────┐ │ │
│  │  │  Auth   │ │  Book   │ │ Student  │ │ Loan  │ │   Reports   │ │ │
│  │  │Controller│ │Controller│ │Controller│ │Control│ │ Controller  │ │ │
│  │  │         │ │         │ │          │ │  ler  │ │             │ │ │
│  │  └─────────┘ └─────────┘ └──────────┘ └───────┘ └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      MODELS LAYER (Mongoose)                   │ │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌───────┐ ┌─────────────┐ │ │
│  │  │  User   │ │  Book   │ │ Student  │ │ Loan  │ │     PQR     │ │ │
│  │  │ Model   │ │ Model   │ │  Model   │ │ Model │ │   Model     │ │ │
│  │  └─────────┘ └─────────┘ └──────────┘ └───────┘ └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      SERVICES LAYER                            │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │ │
│  │  │   Scheduler     │  │   Email         │  │   Maintenance   │  │ │
│  │  │   Service       │  │   Service       │  │   Service       │  │ │
│  │  │   (Automated    │  │   (Future)      │  │   (Auto Clean)  │  │ │
│  │  │    Tasks)       │  │                 │  │                 │  │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                     ┌─────────────────────────┐
                     │    DATABASE LAYER       │
                     │      (MongoDB)          │
                     │                         │
                     │  ┌─────┐  ┌──────────┐  │
                     │  │Books│  │ Students │  │
                     │  │ Coll│  │   Coll   │  │
                     │  └─────┘  └──────────┘  │
                     │  ┌─────┐  ┌──────────┐  │
                     │  │Loans│  │  Users   │  │
                     │  │ Coll│  │   Coll   │  │
                     │  └─────┘  └──────────┘  │
                     │  ┌─────┐                │
                     │  │PQRs │                │
                     │  │Coll │                │
                     │  └─────┘                │
                     └─────────────────────────┘
```

## 🔄 Flujo de Datos - Crear Préstamo

```
1. Frontend          →  2. Routes           →  3. Middleware      →  4. Controller
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Usuario   │ POST    │ loanRoutes  │ Auth +  │ loanStatus  │ Validar │ loanCtrl    │
│  Selecciona │ Request │    .post    │ Update  │  Middleware │  Datos  │ .createLoan │
│ Libro + Est │   →     │   ('/')     │   →     │     →       │    →    │      →      │
└─────────────┘         └─────────────┘         └─────────────┘         └─────────────┘
                                                                                │
5. Validaciones      ←  6. Database         ←  7. Models           ←  8. Business Logic
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│• Libro      │         │  MongoDB    │         │ Loan.create │         │• Verificar  │
│  disponible │ Queries │ Collections │ Mongoose│ Book.find   │ Queries │  disponibil │
│• Estudiante │   ←     │   Update    │   ←     │ Student.find│   ←     │• Asignar    │
│  activo     │         │             │         │             │         │  copia auto │
│• Límites    │         │             │         │             │         │• Calcular   │
│  préstamo   │         │             │         │             │         │  fecha venc │
└─────────────┘         └─────────────┘         └─────────────┘         └─────────────┘
        │                                                                       │
        │                     ← Response Flow ←                                │
        ↓                                                                       ↓
9. Respuesta        ←  10. HTTP Response   ←  11. JSON Format    ←  12. Success/Error
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│ Frontend    │ Updates │   Express   │ Status  │  Controller │ Return  │   Result    │
│ actualiza   │   ←     │  Response   │ + JSON  │  Response   │ Object  │ Success:    │
│ interfaz    │         │             │   ←     │             │   ←     │ loan created│
│ usuario     │         │             │         │             │         │ Error: msg  │
└─────────────┘         └─────────────┘         └─────────────┘         └─────────────┘
```

## 📊 Modelo de Datos - Relaciones

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DIAGRAMA ENTIDAD-RELACIÓN                         │
└──────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐                    ┌─────────────────┐
    │      USER       │                    │     STUDENT     │
    │                 │                    │                 │
    │ • _id           │                    │ • _id           │
    │ • name          │                    │ • name          │
    │ • email         │                    │ • idNumber      │
    │ • password      │                    │ • grade         │
    │ • role          │                    │ • contactInfo   │
    │ • isActive      │                    │ • notes         │
    │ • createdAt     │                    │ • isActive      │
    │ • updatedAt     │                    │ • createdAt     │
    └─────────────────┘                    │ • updatedAt     │
                                           └─────────────────┘
                                                     │
                                                     │ 1:N
                                                     │ (has many loans)
                                                     ↓
    ┌─────────────────┐     N:1      ┌─────────────────┐     1:N      ┌─────────────────┐
    │      BOOK       │ ←────────── │      LOAN       │ ────────→    │     COPIES      │
    │                 │  (belongs    │                 │  (has many)  │   (Virtual)     │
    │ • _id           │   to book)   │ • _id           │              │                 │
    │ • title         │              │ • book (ref)    │              │ • copyNumber: 1 │
    │ • author        │              │ • student (ref) │              │ • copyNumber: 2 │
    │ • isbn          │              │ • copyNumber    │              │ • copyNumber: 3 │
    │ • genre         │              │ • loanDate      │              │ • ...           │
    │ • publishedYear │              │ • dueDate       │              │                 │
    │ • location      │              │ • returnDate    │              │ Status per copy:│
    │ • description   │              │ • status        │              │ • Available     │
    │ • language      │              │ • renewalCount  │              │ • On Loan       │
    │ • publisher     │              │ • renewalHist[] │              │ • Overdue       │
    │ • pages         │              │ • loanedBy      │              │ • Lost          │
    │ • isActive      │              │ • returnedBy    │              │ • Damaged       │
    │ • createdAt     │              │ • loanType      │              └─────────────────┘
    │ • updatedAt     │              │ • notes         │
    └─────────────────┘              │ • condition     │
                                     │ • createdAt     │
                                     │ • updatedAt     │
                                     └─────────────────┘
                                              │
                                              │ 1:N
                                              │ (can have multiple)
                                              ↓
                                     ┌─────────────────┐
                                     │      PQR        │
                                     │                 │
                                     │ • _id           │
                                     │ • title         │
                                     │ • description   │
                                     │ • type          │
                                     │ • student (ref) │
                                     │ • loan (ref)    │
                                     │ • status        │
                                     │ • priority      │
                                     │ • response      │
                                     │ • createdAt     │
                                     │ • updatedAt     │
                                     └─────────────────┘
```

## 🔄 Estados y Transiciones del Sistema

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        ESTADOS DE PRÉSTAMO                                │
└────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐
    │   INICIO    │
    │  (Nuevo)    │
    └──────┬──────┘
           │ createLoan()
           ↓
    ┌─────────────┐     renewLoan()     ┌─────────────┐
    │  PRESTADO   │ ←──────────────────→ │  RENOVADO   │
    │             │                     │             │
    │ • Activo    │                     │ • Extended  │
    │ • En tiempo │                     │ • New due   │
    └──────┬──────┘                     └─────────────┘
           │                                    │
           │ dueDate passed                     │ dueDate passed
           │ (auto update)                      │ (auto update)
           ↓                                    ↓
    ┌─────────────┐                     ┌─────────────┐
    │  ATRASADO   │                     │  ATRASADO   │
    │             │                     │             │
    │ • Overdue   │                     │ • Overdue   │
    │ • Penalties │                     │ • Penalties │
    └──────┬──────┘                     └─────────────┘
           │                                    │
           │ returnBook()                       │ returnBook()
           │                                    │
           ↓                                    ↓
    ┌─────────────┐                            │
    │  DEVUELTO   │ ←──────────────────────────┘
    │             │
    │ • Returned  │
    │ • Completed │
    └─────────────┘
           │
           │ markAs()
           ↓
    ┌─────────────┐     ┌─────────────┐
    │   PERDIDO   │     │   DAÑADO    │
    │             │     │             │
    │ • Lost      │     │ • Damaged   │
    │ • Penalty   │     │ • Condition │
    └─────────────┘     └─────────────┘
```

## 🔧 Arquitectura de Middleware

```
┌────────────────────────────────────────────────────────────────────────────┐
│                     PIPELINE DE MIDDLEWARE                                │
└────────────────────────────────────────────────────────────────────────────┘

HTTP Request →  Express App  →  Middleware Chain  →  Route Handler  →  Response

    ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
    │   CLIENT    │   │   GLOBAL    │   │    ROUTE    │   │ CONTROLLER  │
    │   REQUEST   │ → │ MIDDLEWARE  │ → │ MIDDLEWARE  │ → │   HANDLER   │
    └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
                            │                   │               │
                            ↓                   ↓               ↓
                      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
                      │• CORS       │   │• Auth JWT   │   │• Business   │
                      │• Body Parse │   │• Loan Status│   │  Logic      │
                      │• Morgan Log │   │  Update     │   │• Validation │
                      │• Rate Limit │   │• Permission │   │• Database   │
                      │• Error Hand │   │  Check      │   │  Operations │
                      └─────────────┘   └─────────────┘   └─────────────┘
                            │                   │               │
                            ↓                   ↓               ↓
                      ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
                      │  Next() or  │   │  Next() or  │   │  Response   │
                      │  Error()    │   │  Error()    │   │  JSON       │
                      └─────────────┘   └─────────────┘   └─────────────┘
```

## 📚 Patrones de Diseño Implementados

### 1. **MVC (Model-View-Controller)**
- **Model**: Mongoose schemas (Book, Student, Loan, etc.)
- **View**: JSON responses (API)
- **Controller**: Business logic handlers

### 2. **Repository Pattern**
- Controllers usan modelos como repositorios
- Abstracción de acceso a datos
- Queries centralizadas en modelos

### 3. **Middleware Pattern**
- Cadena de procesamiento de requests
- Separación de concerns
- Reutilización de funcionalidad

### 4. **Service Layer Pattern**
- Lógica de negocio en controllers
- Servicios auxiliares (Scheduler, Email, etc.)
- Separación entre routes y business logic

### 5. **Factory Pattern**
- Creación automática de copias de libros
- Asignación inteligente de números de copia
- Generación de reportes por tipo

## 🚀 Escalabilidad y Performance

### Optimizaciones Implementadas:
- ✅ **Índices de base de datos** optimizados
- ✅ **Paginación** en todas las listas
- ✅ **Agregaciones** MongoDB para reportes
- ✅ **Lazy loading** de relaciones
- ✅ **Soft deletes** para integridad

### Futuras Optimizaciones:
- 🔄 **Cache con Redis** para queries frecuentes
- 🔄 **Rate limiting** por IP/usuario
- 🔄 **Compression** middleware
- 🔄 **Database connection pooling**
- 🔄 **Clustering** para múltiples CPUs

---

**Arquitectura diseñada para ser escalable, mantenible y eficiente** 🚀
