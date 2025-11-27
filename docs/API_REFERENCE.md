# Referencia de API

Este documento describe los endpoints principales expuestos por el backend de **Biblioteca Digital**. Todos los endpoints, salvo que se indique lo contrario, requieren autenticación con token JWT en el encabezado `Authorization: Bearer <token>`.

## Tabla de Contenido

1. [Autenticación](#autenticación)
2. [Usuarios](#usuarios)
3. [Personas](#personas)
4. [Libros](#libros)
5. [Préstamos](#préstamos)
6. [Asistencia](#asistencia)
7. [Permisos y roles](#permisos-y-roles)
8. [Sistema](#sistema)
9. [Convenciones de error](#convenciones-de-error)

---

## Autenticación

### POST `/api/auth/login`
- **Descripción**: Autentica un usuario y devuelve tokens.
- **Body**:
  ```json
  {
    "username": "admin",
    "password": "secret"
  }
  ```
- **Respuesta 200**:
  ```json
  {
    "success": true,
    "token": "<jwt>",
    "user": {
      "id": "...",
      "role": "admin",
      "mustChangePassword": false
    }
  }
  ```
- **Errores**: `401 Credenciales inválidas`, `423 Usuario bloqueado`.

### POST `/api/auth/logout`
- Invalida el token (opcional si se maneja en frontend).

### GET `/api/auth/me`
- Devuelve información de la sesión actual.

---

## Usuarios

### GET `/api/users`
- **Roles permitidos**: `admin`, `superadmin`.
- **Query opcional**: `search`, `role`, `estado`.

### POST `/api/users`
- Crea un usuario a partir de una persona (`personRef`).
- Valida permisos según rol solicitante.

### PUT `/api/users/:id`
- Actualiza datos y rol.

### DELETE `/api/users/:id`
- Desactiva usuario (no eliminar físico por auditoría).

---

## Personas

### GET `/api/persons`
- Lista personas con filtros (`tipoPersona`, `grado`, `grupo`, `search`).

### GET `/api/persons/:id`
- Retorna detalles completos de una persona.

### POST `/api/persons`
- Crea nueva persona. Requiere campos obligatorios (`doc`, `nombre1`, `apellido1`, etc.).

### PUT `/api/persons/:id`
- Actualiza registro.

### PUT `/api/persons/:id/status`
- Cambia estado (`Activo`, `Suspendido`, `Vetado`).

### GET `/api/persons/search`
- Búsqueda rápida (usa `query=<texto>` y `tipoPersona=Estudiante`).

---

## Libros

### GET `/api/books`
- Lista libros, soporta filtros (`isbn`, `titulo`, `autor`, paginación).

### POST `/api/books`
- Crea libro/copia.

### PUT `/api/books/:id`
- Actualiza información.

### DELETE `/api/books/:id`
- Marca como inactivo.

### POST `/api/books/bulk`
- Carga masiva mediante CSV (ver guía de mantenimiento).

---

## Préstamos

### GET `/api/loans`
- Lista préstamos, admite filtros por estado (`pendiente`, `prestado`, `atrasado`, `devuelto`).

### POST `/api/loans`
- Solicita préstamo para un estudiante.

### POST `/api/loans/:id/approve`
- Aprueba préstamo pendiente (admin/superadmin).

### POST `/api/loans/:id/return`
- Registra devolución.

### GET `/api/loans/user/:personId`
- Histórico por estudiante.

---

## Asistencia

### GET `/api/attendance/active`
- Retorna asistencia activa (check-in sin check-out).

### POST `/api/attendance/bulk-checkin`
- Marca entrada para una lista de `personIds`.

### POST `/api/attendance/bulk-checkout`
- Marca salida masiva.

### GET `/api/attendance/group/:grado/:grupo`
- Lista asistencia por grupo y fecha (`?date=YYYY-MM-DD`).

### GET `/api/attendance/present-by-grade/:grado`
- Muestra todos los presentes del grado.

---

## Permisos y roles

### GET `/api/permissions`
- Lista permisos disponibles.

### POST `/api/permissions/assign`
- Asigna permisos extra a un rol/usuario.

### GET `/api/roles`
- Lista roles y permisos asociados.

---

## Sistema

### GET `/api/system/config`
- Obtiene configuraciones globales.

### PUT `/api/system/config`
- Actualiza parámetros (restringido a `superadmin`).

### GET `/api/system/logs`
- Acceso a bitácora (paginado).

---

## Convenciones de error

- Todas las respuestas de error siguen la forma:
  ```json
  {
    "success": false,
    "message": "Descripción legible",
    "error": "Detalles técnicos opcionales"
  }
  ```
- Códigos comunes:
  - `400` Petición inválida (datos faltantes, validación).
  - `401` No autenticado.
  - `403` Permiso insuficiente.
  - `404` Recurso no encontrado.
  - `409` Conflicto (duplicados, préstamos pendientes).
  - `500` Error interno.

> Actualiza esta referencia cuando se cree, modifique o depreque un endpoint.
