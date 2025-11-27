# Actividad Práctica: Gestión de Roles en el Sistema de Biblioteca

## 📋 Objetivo
Realizar una simulación completa del flujo de trabajo en el sistema de biblioteca, involucrando a diferentes roles de usuario con tareas específicas que demuestren la funcionalidad del sistema.

## 👥 Roles Participantes

1. **Superadministrador (1 persona)** - Acceso completo al sistema
2. **Administradores (5 personas)** - Gestión de usuarios y préstamos
3. **Aprendices/Estudiantes (20 personas - 4 por cada administrador)** - Acceden como usuarios estándar ('user')

## 🛠 Configuración Inicial

### 1. Iniciar el Sistema

```bash
# En la raíz del proyecto
npm run dev
```

### 2. Acceder al Sistema
- URL: http://localhost:5173
- Credenciales del Superadministrador por defecto:
  - Usuario: superadmin@biblioteca.com
  - Contraseña: Admin1234*

## 📝 Actividades por Rol

### 🔑 Superadministrador

**Objetivo:** Crear 5 cuentas de administradores

1. Iniciar sesión como Superadministrador
2. Navegar a "Gestión de Usuarios"
3. Hacer clic en "Crear Usuario"
4. Completar el formulario para cada administrador:
   - Seleccionar "Administrador" como rol
   - Ingresar datos personales completos
   - Establecer un correo y contraseña segura
   - Hacer clic en "Guardar"

**Datos de ejemplo para los 5 administradores:**

| # | Nombre           | Correo                     | Rol         |
|---|------------------|----------------------------|-------------|
| 1 | Ana López        | admin1@biblioteca.com      | Administrador |
| 2 | Carlos Ramírez   | admin2@biblioteca.com      | Administrador |
| 3 | María González   | admin3@biblioteca.com      | Administrador |
| 4 | Juan Pérez       | admin4@biblioteca.com      | Administrador |
| 5 | Laura Sánchez    | admin5@biblioteca.com      | Administrador |

### 👨‍💼 Administradores (Bibliotecarios) - Actividades

#### 📚 Actividad 1: Catalogar un Libro Físico

**Objetivo:** Registrar un libro físico en el sistema digital

1. **Preparación del libro físico**
   - Tomar el libro físico asignado
   - Revisar la información básica (portada, contraportada, páginas iniciales)
   - Identificar los elementos clave: ISBN, editorial, año de publicación, etc.

2. **Búsqueda de información en línea**
   - Usar el ISBN o título para buscar información en bases de datos en línea
   - Descargar la portada del libro en buena calidad
   - Verificar que la información coincida con el libro físico

3. **Registro en el sistema**
   - Iniciar sesión en el sistema
   - Navegar a "Gestión de Libros" > "Agregar Nuevo Libro"
   - Completar la ficha técnica:
     - Título y subtítulo
     - Autor(es) y traductor(es)
     - Editorial y año de publicación
     - ISBN y código de barras
     - Categorías y palabras clave
     - Sinopsis
     - Número de páginas
     - Idioma
   - Subir la imagen de la portada
   - Establecer la cantidad de ejemplares disponibles
   - Asignar ubicación física en la biblioteca
   - Guardar la información

4. **Verificación**
   - Buscar el libro recién registrado en el catálogo
   - Verificar que toda la información sea correcta
   - Realizar correcciones si es necesario

#### 👥 Actividad 2: Gestión de Usuarios y Personas

**Objetivo:** Registrar 4 aprendices en el sistema (persona + usuario)

1. **Búsqueda inicial de la persona**
   - Navegar a "Gestión de Usuarios"
   - Hacer clic en "Crear Usuario"
   - En la pestaña "Usuario Existente":
     - Buscar por documento de identidad o nombre
     - Si la persona EXISTE, seleccionarla y continuar al paso 2
     - Si la persona NO EXISTE, ir al paso 3

2. **Crear solo usuario (persona existente)**
   - Completar los campos del formulario de usuario:
     - Seleccionar "user" como rol
     - Verificar que los datos de la persona sean correctos
     - Establecer un nombre de usuario (puede ser el correo o documento)
     - Generar o establecer una contraseña temporal
   - Hacer clic en "Guardar"
   - Ir al paso 4

3. **Crear persona y usuario (nuevo registro)**
   - Hacer clic en la pestaña "Crear Persona y Usuario"
   - Completar la sección de Datos Personales:
     - Tipo y número de documento
     - Nombres y apellidos completos
     - Fecha de nacimiento
     - Género
     - Correo electrónico
     - Teléfono de contacto
     - Dirección
     - Otros campos requeridos
   - Completar la sección de Usuario:
     - Seleccionar "user" como rol
     - Establecer nombre de usuario y contraseña
     - Verificar que el correo coincida con el de la persona
   - Revisar que toda la información sea correcta
   - Hacer clic en "Guardar"

4. **Verificación y entrega de credenciales**
   - Al guardar, el sistema mostrará un mensaje de confirmación
   - Anotar o imprimir las credenciales generadas
   - Verificar en el listado que el usuario aparece correctamente
   - Confirmar que la persona está vinculada al usuario
   - Entregar las credenciales al estudiante de manera segura

**Datos de ejemplo para los aprendices (4 por administrador):**

| # | Nombre           | Correo                     | Rol      |
|---|------------------|----------------------------|----------|
| 1 | Estudiante 1     | estudiante1@instituto.edu  | Estudiante |
| 2 | Estudiante 2     | estudiante2@instituto.edu  | Estudiante |
| 3 | Estudiante 3     | estudiante3@instituto.edu  | Estudiante |
| 4 | Estudiante 4     | estudiante4@instituto.edu  | Estudiante |

### 🎓 Aprendices/Estudiantes (cada uno realizará lo siguiente)

**Nota:** Los estudiantes accederán al sistema con el rol 'user'.

**Objetivo:** Realizar el flujo completo de préstamo de un libro, integrando la búsqueda física con el proceso digital

#### 📚 Fase 1: Búsqueda Física en la Biblioteca

1. **Recibir lista de libros**
   - Cada estudiante recibirá una lista con 3 libros disponibles en la biblioteca física
   - La lista incluirá: Título, Autor y Código de Clasificación

2. **Localización física**
   - Usar el sistema de clasificación para encontrar los libros en las estanterías
   - Verificar que el libro esté en buen estado
   - Anotar cualquier observación sobre el estado físico

3. **Selección del libro**
   - Elegir 1 libro de la lista que deseen solicitar en préstamo
   - Anotar los detalles completos del libro seleccionado

#### 💻 Fase 2: Proceso Digital

1. **Acceso al sistema**
   - Iniciar sesión con sus credenciales
   - Navegar a la sección de búsqueda de libros

2. **Búsqueda y verificación**
   - Buscar el libro seleccionado usando diferentes criterios (título, autor, ISBN)
   - Verificar que la información digital coincida con el libro físico
   - Confirmar disponibilidad en el sistema

3. **Solicitud de préstamo**
   - Seleccionar "Solicitar Préstamo"
   - Revisar los términos del préstamo
   - Confirmar la solicitud

#### 📋 Fase 3: Proceso de Entrega Física

1. **Registro en mostrador**
   - Llevar el libro físico al mostrador de préstamos
   - Presentar credencial de estudiante
   - El bibliotecario verificará la disponibilidad en el sistema

2. **Confirmación de préstamo**
   - El bibliotecario registrará el préstamo en el sistema
   - El estudiante recibirá una confirmación con fecha de devolución
   - Se registrará el estado del libro al momento del préstamo

#### 🔄 Fase 4: Devolución

1. **Preparación para devolución**
   - Verificar que el libro esté en buen estado
   - Asegurarse de no tener anotaciones o daños adicionales

2. **Proceso de devolución física**
   - Llevar el libro al mostrador de devoluciones
   - El bibliotecario verificará el estado del libro
   - Se registrará la devolución en el sistema

3. **Confirmación digital**
   - El estudiante puede verificar en "Mis Préstamos" que el libro ha sido devuelto
   - Se generará un comprobante de devolución

## 🔐 Permisos por Rol

### Superadministrador (superadmin)
- Crear, editar y eliminar cualquier usuario
- Configuración del sistema
- Acceso a todos los reportes y estadísticas
- Gestionar todos los préstamos
- Configuración de roles y permisos
- Acceso a registros de auditoría

### Administradores (admin)
- Crear y gestionar usuarios con rol 'user'
- Gestionar libros y su inventario
- Aprobar/rechazar préstamos
- Generar reportes básicos
- Ver estadísticas de uso
- No pueden modificar configuración del sistema ni roles

### Estudiantes/Aprendices (user)
- Ver catálogo de libros disponibles
- Solicitar préstamos de libros
- Ver su historial de préstamos
- Renovar préstamos (si está permitido)
- Actualizar su perfil personal
- No tienen acceso a la gestión de usuarios ni reportes

## 📊 Evaluación

Cada rol deberá completar sus tareas asignadas. El éxito de la actividad se medirá por:

1. **Superadministrador**: Haber creado correctamente las 5 cuentas de administradores
2. **Administradores**: Haber creado 4 cuentas de aprendices cada uno
3. **Aprendices**: Haber completado el ciclo completo de préstamo de un libro

## 📝 Notas Adicionales

- Cada participante debe mantener un registro de sus actividades
- Los administradores pueden restablecer contraseñas si es necesario
- En caso de errores, notificar al equipo técnico

## 🆘 Soporte

Para problemas técnicos durante la actividad, contactar al equipo de soporte:
- Email: soporte@biblioteca.com
- Teléfono: (123) 456-7890

---

*Documento generado el 30/10/2023 - Sistema de Biblioteca v1.0*
