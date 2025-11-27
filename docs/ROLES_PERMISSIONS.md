# Roles y Permisos

Este documento define la matriz de roles y permisos de la plataforma **Biblioteca Digital**. Se describe lo que cada rol puede o no puede hacer, así como los permisos específicos utilizados internamente.

## 1. Roles principales

| Rol          | Descripción general                                                 |
|--------------|---------------------------------------------------------------------|
| `superadmin` | Control total de la plataforma: usuarios, permisos, configuración.  |
| `admin`      | Gestión operativa: personas, préstamos, asistencia, inventario.     |
| `user`       | Usuario estándar (estudiantes, docentes, público) para consumir catálogos y solicitar préstamos. |

## 2. Permisos base por rol

| Funcionalidad                              | superadmin | admin | user |
|-------------------------------------------|:----------:|:-----:|:----:|
| Acceso a panel específico                  | ✅         | ✅    | ❌   |
| Gestión de usuarios                        | ✅         | ⚠️ (limitado) | ❌ |
| Gestión de roles y permisos                | ✅         | ❌    | ❌   |
| Configuración del sistema                  | ✅         | ❌    | ❌   |
| Gestión de personas                        | ✅         | ✅    | ❌   |
| Gestión de inventario de libros            | ✅         | ✅    | ❌   |
| Creación / aprobación de préstamos         | ✅         | ✅    | ❌   |
| Solicitud de préstamos                     | ✅         | ✅    | ✅   |
| Registro de asistencia                     | ✅         | ✅    | ❌   |
| Lectura de reportes / dashboards           | ✅         | ✅    | ❌   |
| Autogestión de perfil                      | ✅         | ✅    | ✅   |

> ⚠️: Acceso restringido. Por ejemplo, un admin puede crear usuarios estándar pero no otros superadmin.

## 3. Permisos detallados (backend)

El backend soporta un sistema de permisos granular mediante la colección `permissions`. Ejemplos:

- `users:create`, `users:update`, `users:delete`
- `persons:read`, `persons:update`
- `books:create`, `books:bulk-upload`
- `loans:approve`, `loans:return`
- `attendance:checkin`, `attendance:checkout`
- `system:config`, `system:logs`

Los roles se relacionan con estos permisos a través del modelo `Role` y la utilidad `initializePermissions.js`.

## 4. Gestión de permisos personalizados

1. Los permisos base se inicializan ejecutando `backend/utils/initializePermissions.js`.
2. Para asignar permisos personalizados:
   - Usar los endpoints del controlador de permisos (`/api/permissions/...`).
   - O ejecutar scripts administrativos (`backend/controllers/permissionController.js`).
3. Las asociaciones se almacenan en las colecciones `permissions` y `roles`.

## 5. Buenas prácticas

- Mantener la menor cantidad de superadministradores posible.
- Crear roles adicionales si aparecen nuevas necesidades (por ejemplo, `profesor`, `bibliotecario`).
- Auditar regularmente los permisos (`backend/test-permissions.js`).
- Documentar modificaciones en `docs/CHANGELOG.md` y notificar al equipo.

## 6. Flujo de control de acceso

1. El usuario inicia sesión y obtiene un JWT con su rol.
2. El middleware `protect` valida el token.
3. `roleRequired([...])` verifica si el rol del usuario tiene permiso para la ruta.
4. Algunos endpoints consultan permisos adicionales (ver `permissionController`).

## 7. Actualizaciones

- Cuando añadas un nuevo módulo o endpoint, define el permiso asociado.
- Ajusta el script `initializePermissions` para incluirlo.
- Actualiza esta matriz y comunica los cambios.
