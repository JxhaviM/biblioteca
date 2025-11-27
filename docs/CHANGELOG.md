# Historial de Cambios

Este documento resume los cambios relevantes realizados en el proyecto **Biblioteca Digital**. Sigue el formato `YYYY-MM-DD - Descripción`.

## 2025-10-29
- Backend: bootstrap automático del SuperAdministrador usando variables de entorno (`SUPERADMIN_*`).
- Documentación: guía de despliegue actualizada con variables obligatorias/opcionales y verificación del bootstrap.

## 2025-10-28
- Documentación: creación de carpeta `docs/` con guías de arquitectura, despliegue, API, usuarios, permisos, mantenimiento y pruebas.
- Frontend: mejora del buscador de asistencia con búsqueda en vivo y auto check-in.
- Backend: ajuste en cálculo de disponibilidad de libros usando `isBorrowed`.
- UI: botón "Ir a Dashboard" para roles admin/superadmin en la página principal.

## 2025-09-15
- Autenticación: flujo de cambio de contraseña inicial corregido.
- Redirección de usuarios `user` hacia `/` tras login.

## 2025-08-30
- Módulo de préstamos revisado: control de estados `prestado`, `atrasado`, `devuelto`.
- Scripts de mantenimiento añadidos para permisos y limpieza de inventario.

> Actualiza este changelog cada vez que se aplique un cambio significativo en producción o se entregue una nueva versión.
