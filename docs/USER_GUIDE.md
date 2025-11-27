# Manual de Usuario

Este manual describe cómo utilizar la plataforma **Biblioteca Digital** según el rol del usuario. Las instrucciones se enfocan en la interfaz web disponible en `http://localhost:5173` (o la URL configurada en producción).

## 1. Acceso y autenticación

1. Ingresa a la página principal y haz clic en **Iniciar Sesión**.
2. Introduce tu usuario y contraseña.
3. Si es tu primer ingreso, se solicitará cambiar la contraseña.
4. Una vez autenticado, serás redirigido a la vista acorde con tu rol.

> En caso de olvidar la contraseña, contacta al administrador para restablecerla.

## 2. Vista pública (usuarios estándar)

- Muestra catálogo de libros, destacados y noticias.
- Puedes solicitar préstamos desde los libros disponibles.
- Botón "Ir a Dashboard" aparece si tu rol es `admin` o `superadmin`.

## 3. Panel de Superadministrador

- **Ruta**: `/dashboard/superadmin`.
- Funcionalidades principales:
  - Gestión completa de usuarios y roles.
  - Configuración del sistema (permisos, parámetros globales).
  - Acceso a reportes y logs.
  - Control sobre la biblioteca y los préstamos.

## 4. Panel de Administrador

- **Ruta**: `/dashboard/admin`.
- Funcionalidades:
  - Gestión de personas (estudiantes, docentes, público).
  - Aprobación y seguimiento de préstamos.
  - Registro de asistencia.
  - Carga y gestión de inventario de libros.

## 5. Gestión de personas

1. Navega a **Personas**.
2. Usa filtros por grado, grupo o búsqueda por documento/nombre.
3. Acciones disponibles:
   - Crear nueva persona.
   - Actualizar datos básicos.
   - Cambiar estado (Activo, Suspendido, Vetado).
   - Generar usuarios para personas seleccionadas.

## 6. Gestión de libros y préstamos

### 6.1 Inventario de libros
- Desde **Libros**:
  - Agrega nuevos libros o copias.
  - Edita información (título, autor, género, ISBN).
  - Marca como inactivos para retirarlos del catálogo.

### 6.2 Préstamos
1. Selecciona un libro disponible y solicita préstamo.
2. Los administradores aprueban préstamos pendentes.
3. Se puede registrar devolución manualmente.
4. El estado del libro se actualiza automáticamente (`isBorrowed`).

## 7. Control de asistencia

- **Ruta**: `/attendance`.
- Buscador en vivo permite localizar estudiantes por nombre/documento.
- Al hacer clic sobre un resultado se marca la asistencia (check-in).
- Vistas disponibles:
  - **Activos ahora**: estudiantes con check-in vigente.
  - **Marcar Asistencia**: lista del grupo seleccionado.
  - **Presentes**: asistentes del día.
  - **Todos del Grado**: presentes por grado.
- Se pueden procesar entradas y salidas masivas.

## 8. Notificaciones y alertas

- El sistema muestra banners con resultados de acciones (éxito/error).
- Revisar la bandeja lateral de notificaciones (si está habilitada).

## 9. Scripts y operaciones especiales

- Algunas tareas se ejecutan por scripts (por ejemplo, cargas masivas o ajustes de permisos). Revisa `docs/MAINTENANCE_GUIDE.md` antes de usarlos.

## 10. Preguntas frecuentes

- **No veo el botón para ir al panel**: asegúrate de tener rol `admin` o `superadmin` y haber iniciado sesión.
- **No puedo prestar un libro**: verifica que existan copias disponibles y que no tengas préstamos atrasados.
- **Necesito reiniciar mi contraseña**: contactar a soporte o un administrador.

## 11. Soporte

- Soporte funcional: servicios.biblioteca@example.com
- Soporte técnico: soporte-ti@example.com
- Horario de atención: lunes a viernes 8:00 - 18:00

> Mantén este manual actualizado cuando se introduzcan nuevas vistas o cambios significativos en el flujo de usuario.
