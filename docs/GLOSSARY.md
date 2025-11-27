# Glosario de Términos

Este glosario recopila los términos clave utilizados en la plataforma **Biblioteca Digital**.

| Término | Definición |
|---------|------------|
| **Aprendiz / Estudiante** | Persona que utiliza la biblioteca para consultar o solicitar préstamo de libros. Registrada en la colección `persons` con `tipoPersona = Estudiante`. |
| **Administrador** | Usuario con rol `admin`. Gestiona libros, préstamos, asistencia y personas. |
| **Superadministrador** | Usuario con rol `superadmin`. Tiene control total de configuración, permisos y auditoría. |
| **Usuario estándar** | Rol `user`. Accede al catálogo, realiza solicitudes y consulta préstamos propios. |
| **Préstamo** | Registro en la colección `loans` que vincula un estudiante con una copia de libro y su estado (`pendiente`, `prestado`, `devuelto`, `atrasado`). |
| **Check-in / Check-out** | Registro de entrada o salida en asistencia. Implementado en `/api/attendance/bulk-checkin` y `/bulk-checkout`. |
| **Disponibilidad del libro** | Cálculo que usa `Book.getAvailabilityInfo()` para indicar número de copias disponibles. |
| **Bulk Upload** | Proceso de carga masiva (libros o personas) mediante archivos CSV. |
| **Permiso** | Acción granular que puede asignarse a un rol/usuario (ej. `loans:approve`). |
| **JWT** | Token de autenticación (JSON Web Token) usado para asegurar endpoints. |
| **Script de mantenimiento** | Utilidades en `backend/scripts/` para tareas especiales (migraciones, limpieza). |
| **Dashboard** | Vista principal para cada rol (`/dashboard/superadmin`, `/dashboard/admin`). |
| **RBAC** | Control de acceso basado en roles (Role-Based Access Control). |
| **Logs** | Registros de auditoría almacenados en la colección `logs` o en archivos del servidor. |
| **Config** | Parámetros globales administrados via `Config` model y endpoints del sistema. |
| **CI/CD** | Integración/Despliegue continuo para automatizar pruebas y entregas. |
| **Staging** | Entorno de pruebas antes de producción. |

> Agrega nuevos términos a medida que se incorporen módulos o conceptos al proyecto.
