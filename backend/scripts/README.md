# 🔐 Scripts de Administración del Sistema

Este directorio contiene scripts útiles para la administración inicial del sistema de biblioteca.

## 📋 Scripts Disponibles

### 1. **Crear SuperAdmin Personalizado**
```bash
npm run create-superadmin
```
- 📝 Proceso interactivo paso a paso
- 🔒 Entrada de contraseña oculta  
- 👤 Datos personales completos
- 🛡️ Más seguro para producción

### 2. **Setup Rápido del SuperAdmin** 
```bash
npm run setup-admin
```
- ✅ Crea un superadmin con credenciales por defecto
- 📧 Email: `admin@biblioteca.com`
- 🔒 Password: `admin123`
- ⚡ Solo funciona si no existe ningún superadmin

### 3. **Ver Usuarios del Sistema**
```bash
npm run show-users
```
- � Lista todos los usuarios registrados
- 🔍 Muestra información detallada de cada usuario
- � Indica credenciales de login del superadmin

### 4. **Resetear Contraseña del SuperAdmin**
```bash
npm run reset-password
```
- � Permite cambiar la contraseña del superadmin existente
- � Proceso interactivo seguro
- ✅ Ideal cuando olvidas la contraseña

### 5. **Test de Login**
```bash
npm run test-login
```
- 🧪 Prueba las credenciales de acceso
- 🔑 Muestra el token JWT generado
- ✅ Verifica que el sistema funcione correctamente

## 🚀 Flujos de Uso

### Para Sistema Nuevo (Primera Instalación):
```bash
# 1. Iniciar el servidor
npm run dev

# 2. Crear superadmin interactivo (recomendado)
npm run create-superadmin

# 3. Verificar login
npm run test-login
```

### Para Desarrollo Rápido:
```bash
# 1. Iniciar el servidor
npm run dev

# 2. Setup rápido (solo si no hay superadmin)
npm run setup-admin

# 3. Login con credenciales por defecto
# Username: super.administrador
# Password: admin123
```

### Para Recuperar Acceso:
```bash
# 1. Ver usuarios existentes
npm run show-users

# 2. Resetear contraseña del superadmin
npm run reset-password

# 3. Probar nuevo login
npm run test-login
```

## 📝 Información de cada Script

### `create-superadmin.js`
- **Propósito**: Crear superadmin con datos personalizados
- **Requisitos**: No debe existir ningún superadmin
- **Ventajas**: 
  - Datos completamente personalizables
  - Contraseña oculta durante entrada
  - Validación completa de campos
- **Uso**: Instalaciones de producción

### `setup-admin.js`
- **Propósito**: Setup automático para desarrollo
- **Datos fijos**: 
  - Email: admin@biblioteca.com
  - Password: admin123
  - Username: Se genera automáticamente
- **Limitación**: Solo funciona si no existe superadmin
- **Uso**: Desarrollo rápido, demos

### `show-users.js`
- **Propósito**: Diagnóstico del sistema
- **Información que muestra**:
  - Todos los usuarios registrados
  - Username y email de cada usuario
  - Roles y estados
  - Información de personas asociadas
  - Credenciales de login para superadmin

### `reset-superadmin-password.js`
- **Propósito**: Recuperación de acceso
- **Características**:
  - Conexión directa a MongoDB
  - Hash seguro de nueva contraseña
  - Confirmación de contraseña
  - Validación de longitud mínima

### `test-login.js`
- **Propósito**: Verificar funcionamiento
- **Características**:
  - Prueba conexión al servidor
  - Valida credenciales de login
  - Muestra información del usuario logueado
  - Genera token JWT para usar en API

## 🔧 Casos de Uso Comunes

### ❓ "¿Cuál es mi username?"
```bash
npm run show-users
```

### � "Olvidé mi contraseña"
```bash
npm run reset-password
```

### 🆕 "Primera instalación"
```bash
npm run create-superadmin
```

### ⚡ "Setup rápido para desarrollo"
```bash
npm run setup-admin
```

### 🧪 "¿Funciona el login?"
```bash
npm run test-login
```

## ⚠️ Notas Importantes

1. **Único SuperAdmin**: Solo puede existir UN superadmin por sistema
2. **Username vs Email**: El login se hace con `username`, no con email
3. **Generación de Username**: Se crea automáticamente como `apellido.nombre`
4. **Token JWT**: Válido por 24 horas
5. **MongoDB**: Todos los scripts requieren conexión activa

## 🔑 Credenciales por Defecto

Si usas `npm run setup-admin`, las credenciales serán:
- **Email**: admin@biblioteca.com  
- **Password**: admin123
- **Username**: Se genera automáticamente (ej: `super.administrador`)

## 🐛 Solución de Problemas

### "No se pudo conectar al servidor"
```bash
# Verifica que el servidor esté corriendo
npm run dev
```

### "SuperAdministrador ya existe"
```bash
# Ve qué usuarios existen
npm run show-users

# O resetea la contraseña
npm run reset-password
```

### "Credenciales inválidas"
```bash
# Verifica el username correcto
npm run show-users

# Resetea la contraseña si es necesario  
npm run reset-password
```

### "Username y contraseña son requeridos"
```bash
# Asegúrate de usar "username", no "email" en el login
# POST /api/auth/login
# {"username": "super.administrador", "password": "tu_password"}
```

---

💡 **Tip**: Siempre usa `npm run show-users` primero para ver el estado actual del sistema.
