# Guía de Mantenimiento

Este documento describe las tareas periódicas y procedimientos especiales para mantener operativa la plataforma **Biblioteca Digital**.

## 1. Tareas periódicas

| Frecuencia | Tarea | Descripción |
|------------|-------|-------------|
| Diario     | Revisión de logs | Analizar `backend/logs/` y registros del servidor para detectar errores. |
| Diario     | Verificar copias de seguridad | Confirmar que los backups de MongoDB se generaron y almacenaron correctamente. |
| Semanal    | Limpieza de préstamos vencidos | Validar préstamos en estado `atrasado` y notificar a responsables. |
| Quincenal  | Revisar asistencia | Revisar registros anómalos o duplicados. |
| Mensual    | Actualizar dependencias | Ejecutar `npm outdated` y planificar actualizaciones seguras. |
| Trimestral | Ensayo de recuperación | Probar restauración desde backup y documentar tiempos. |

## 2. Scripts de mantenimiento

Los scripts se encuentran en `backend/scripts/`. Ejecutarlos con `node nombreDelScript.js`. Asegúrate de configurar variables de entorno antes de usarlos.

| Script | Propósito |
|--------|-----------|
| `checkUsersPersonData.js` | Valida consistencia entre usuarios y personas asociadas. |
| `fixSuperAdminRole.js` | Ajusta permisos del superadmin en caso de desincronización. |
| `purgeBooks.js` | Limpia libros inactivos o duplicados (revisar antes de usar). |
| `removeBookTitleUniqueIndex.js` | Elimina índice único en títulos si se requiere. |
| `removeISBNUniqueIndex.js` | Elimina índice único en ISBN para permitir copias múltiples. |

> Antes de ejecutar un script destructivo (`purgeBooks`), realiza un backup completo y prueba en entorno de staging.

## 3. Inicialización de roles y permisos

- Scripts relevantes: `backend/utils/initializePermissions.js` y `backend/utils/compatibilityPermissions.js`.
- Uso típico:
  ```bash
  node backend/utils/initializePermissions.js
  ```
- Esto creará o sincronizará la matriz de roles/permisos. Úsalo después de desplegar cambios en el sistema de permisos.

## 4. Cargas masivas

- **Libros**: Usa `frontend/src/components/BulkUploadBooksModal.tsx`, que invoca `/api/books/bulk`.
- **Personas**: Procesamiento mediante `backend/controllers/bookBulkController.js` y `BulkJob`.
- Asegúrate de que la carpeta `backend/uploads/` tenga permisos de escritura.
- Revisa `backend/scripts/README.md` (si aplica) para formatos CSV aceptados.

## 5. Monitoreo y alertas

- Implementa monitoreo externo (Pingdom, UptimeRobot) sobre la API y la web.
- Configura alertas de disco, RAM y CPU en el servidor.
- Habilita logs estructurados y centraliza con herramientas como ELK o Loki.

## 6. Actualizaciones de versión

1. Crea un branch `release/x.y`.
2. Actualiza dependencias mayores con cautela.
3. Ejecuta pruebas manuales y automatizadas.
4. Documenta cambios en `docs/CHANGELOG.md`.
5. Coordina ventana de mantenimiento para producción.

## 7. Procedimiento ante incidentes

1. Registrar la incidencia (fecha, síntomas, usuarios afectados).
2. Recolectar logs y métricas.
3. Mitigar (reinicio de servicios, rollback si es necesario).
4. Analizar causa raíz y actualizar documentación.
5. Comunicar al equipo y cerrar incidente en herramienta correspondiente.

## 8. Checklist post-despliegue

- [ ] Confirmar servicio backend respondiendo `GET /api/health` (si existe) o `/api/auth/me` con token válido.
- [ ] Verificar que el frontend sirva la última versión (`Ctrl+F5`).
- [ ] Revisar tareas en cola (préstamos, notificaciones).
- [ ] Monitorizar logs durante la primera hora posterior al despliegue.

## 9. Contactos

- DevOps: devops@example.com
- DBA: dba@example.com
- Soporte TI: soporte@example.com

> Mantén este documento actualizado conforme se agreguen nuevos scripts o cambien los procedimientos operativos.
