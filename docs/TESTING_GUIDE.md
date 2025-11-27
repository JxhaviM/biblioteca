# Guía de Pruebas

Esta guía establece los criterios y procedimientos de prueba para la plataforma **Biblioteca Digital**.

## 1. Objetivos

- Garantizar que los flujos críticos (login, préstamos, asistencia) funcionen.
- Detectar regresiones antes de llegar a producción.
- Documentar casos de prueba manuales y automatizados.

## 2. Tipos de prueba

| Tipo         | Cobertura | Herramientas |
|--------------|-----------|--------------|
| Unitarias     | Funciones y servicios backend/frontend | Jest, Vitest (pendiente configurar) |
| Integración   | API REST completa con MongoDB | Supertest, MongoDB Memory Server |
| End-to-End    | Flujos UI completos | Cypress o Playwright (pendiente) |
| Manuales      | Casos críticos y validaciones visuales | Checklists documentados |

## 3. Preparación del entorno de pruebas

1. Configura variables de entorno específicas (`.env.test`).
2. Usa base de datos separada (`biblioteca_test`).
3. Ejecuta migraciones/scripts necesarios antes de correr pruebas.

## 4. Pruebas automatizadas (sugerido)

### 4.1 Backend

- Estructura prevista en `backend/tests/`.
- Ejemplo de script en `package.json`:
  ```json
  "scripts": {
    "test": "cross-env NODE_ENV=test jest"
  }
  ```
- Cubrir controladores de auth, loans y attendance.

### 4.2 Frontend

- Ubicar pruebas en `frontend/src/__tests__/`.
- Configurar Vitest o React Testing Library.
- Pruebas mínimas: componentes críticos (`LoginModal`, `AttendancePage`).

### 4.3 End-to-End

- Configurar Cypress/Playwright para:
  1. Login y redirección por rol.
  2. Solicitar préstamos.
  3. Registrar asistencia con buscador en vivo.
  4. Cambiar estado de personas.

## 5. Pruebas manuales prioritarias

| Caso | Pasos | Resultado esperado |
|------|-------|--------------------|
| Login superadmin | Ingresar credenciales | Redirección a `/dashboard/superadmin` |
| Cambio de contraseña inicial | Usuario nuevo → login | Se solicita cambio y luego se accede |
| Crear préstamo | Seleccionar libro con disponibilidad | Estado `prestado`, disponibilidad decrementa |
| Devolver libro | Registrar devolución | Disponibilidad incrementa, estado `devuelto` |
| Búsqueda asistencia | Escribir nombre en `/attendance` | Resultados en vivo y click marca entrada |
| Cerrar sesión | Click en "Cerrar Sesión" | Token eliminado, redirige a home |

## 6. Estrategia de regresión

- Ejecutar checklist manual antes de cada release mayor.
- Priorizar módulos modificados desde el último despliegue.
- Registrar resultados en `docs/CHANGELOG.md` o herramienta de QA.

## 7. Automatización futura

- Integrar pruebas en CI (GitHub Actions): lint → unit → e2e (staging).
- Generar fixtures para datos de prueba (`backend/scripts/*`).
- Medir cobertura y fijar límites mínimos (ej. 70%).

## 8. Reporte de incidencias

- Documentar bug con pasos, entorno, logs adjuntos.
- Priorizar según impacto (P0 crítica, P1 alta, P2 media, P3 baja).
- Registrar en tablero de issues y referenciar commit de corrección.

## 9. Referencias

- `docs/MAINTENANCE_GUIDE.md`: scripts útiles para preparar datos.
- `docs/API_REFERENCE.md`: contratos para pruebas de API.
- `docs/USER_GUIDE.md`: flujos funcionales para validación manual.

> Mantén esta guía actualizada cuando se agreguen nuevas suites, herramientas o flujos críticos.
