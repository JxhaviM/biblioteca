# Arquitectura del Sistema

Este documento describe la arquitectura de alto nivel del proyecto **Biblioteca Digital**, destacando los principales componentes, flujos y decisiones técnicas.

## 1. Visión General

```
[Cliente Web React] ⇄ [API REST Express] ⇄ [MongoDB]
                               │
                               └─ [Servicios auxiliares / Scripts]
```

- **Cliente Web**: Aplicación SPA construida con React + Vite, consumiendo la API.
- **API REST**: Servidor Node.js/Express con controladores organizados por dominio (auth, loans, persons, attendance, etc.).
- **Base de Datos**: MongoDB almacena colecciones para usuarios, personas, libros, préstamos y registros de asistencia.
- **Servicios Auxiliares**: Scripts de mantenimiento, procesamiento de cargas masivas, gestión de permisos y logging.

## 2. Frontend

- **Stack**: React 18, TypeScript, TailwindCSS, React Router DOM.
- **Estructura**:
  - `src/pages/`: páginas principales (Dashboard, AttendancePage, LoansPage, etc.).
  - `src/components/`: componentes reutilizables (modales, tablas, formularios).
  - `src/hooks/`: hooks personalizados (`useAuth`, `useNotificationHelpers`).
  - `src/api/`: clientes HTTP para interactuar con la API (`auth`, `persons`, `books`).
- **Estado**: Se maneja principalmente con hooks nativos; contexto de autenticación a través de `useAuth`.
- **Autenticación**: Tokens JWT almacenados en `localStorage`; redirecciones según rol.

## 3. Backend

- **Stack**: Node.js 18, Express, Mongoose.
- **Capas**:
  - **Rutas** (`backend/routes/*.js`): definen endpoints REST.
  - **Controladores** (`backend/controllers/*.js`): lógica de negocio.
  - **Modelos** (`backend/models/*.js`): esquemas Mongoose.
  - **Middlewares** (`backend/middlewares/*.js`): autenticación, manejo de errores, permisos.
  - **Utils/Scripts**: helpers para búsqueda, inicialización de permisos, migraciones.
- **Autenticación y Autorización**:
  - Middleware `protect` valida JWT.
  - Middleware `roleRequired` y sistema de permisos gestionan acceso.
- **Auditoría**: Modelos `Log` y `Config` permiten registro y configuración en runtime.

## 4. Base de Datos

- **Colecciones principales**:
  - `users`: credenciales y roles.
  - `persons`: información personal (estudiantes, docentes, etc.).
  - `books`: inventario, disponibilidad, metadatos.
  - `loans`: control de préstamos y devoluciones.
  - `attendance`: registros de entrada/salida.
  - `permissions`, `roles`, `logs`, `configs`: soporte para RBAC y auditoría.
- **Relaciones**: se manejan mediante referencias ObjectId (por ejemplo, `Loan.bookId`, `Loan.studentId`).
- **Indices**: optimiza búsquedas por documento, grado/grupo, estado.

## 5. Flujos Clave

### 5.1 Autenticación
1. Usuario ingresa credenciales → `POST /api/auth/login`.
2. Backend valida y emite JWT + refresh tokens (si aplica).
3. Frontend almacena token y redirige según rol.
4. Middleware `protect` asegura rutas privadas.

### 5.2 Gestión de préstamos
1. Admin crea préstamo (`POST /api/loans`).
2. API valida disponibilidad (`Book.getAvailabilityInfo`).
3. Al devolver, `Loan.returnBook()` actualiza `isBorrowed` y estado.
4. Disponibilidad recalculada dinámicamente desde MongoDB.

### 5.3 Control de asistencia
1. Búsqueda rápida de estudiantes (`GET /api/persons/search`).
2. Registro de check-in/check-out vía `/api/attendance/bulk-checkin` y `/bulk-checkout`.
3. Vistas en frontend muestran activos, presentes por grupo y reportes históricos.

## 6. Decisiones de Diseño

- **SPA con React**: responde rápidamente y facilita experiencias ricas para administración.
- **Express + Mongoose**: flexibilidad para modelos cambiantes y lógica de negocio en Node.
- **RBAC Extensible**: separación entre roles base y permisos específicos.
- **Scripts de mantenimiento**: permiten migraciones y ajustes sin depender de UI.
- **Documentación centralizada**: carpeta `docs/` para facilitar entrega y mantenimiento.

## 7. Consideraciones de Seguridad

- Tokens JWT firmados con secreto robusto (`JWT_SECRET`).
- Hash de contraseñas con bcrypt.
- Validación de input y sanitización (pendiente reforzar con JOI/celebrate sobre endpoints críticos).
- CORS restringido por `ALLOW_ORIGINS`.
- Recomendado activar HTTPS y rotación de secretos.

## 8. Escalabilidad

- **Horizontal**: Backend escalable con PM2/cluster; frontend puede servirse vía CDN.
- **Base de datos**: escalar con réplicas, índices adicionales; considerar particionado si crece.
- **Colas**: Posibilidad de integrar Redis o RabbitMQ para procesos pesados (importe masivo, notificaciones).

## 9. Roadmap Técnico

- Implementar pruebas automatizadas (unitarias e integración) como base en CI.
- Desacoplar servicios (por ejemplo, asistencia) si la carga aumenta.
- Agregar monitoreo (Prometheus/Grafana, logs centralizados).
- Documentar endpoints con OpenAPI/Swagger.

> Mantén este documento actualizado cuando cambie la arquitectura o se agreguen nuevos módulos.
