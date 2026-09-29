## Why

La administración no tiene forma de saber si el reclutamiento de una facultad va bien o mal:
el panel muestra inscripciones una por una, pero nadie puede contestar «¿cuántos matriculados
lleva Ingeniería y cuántos esperábamos?». Sin esa cifra, la decisión de empujar una facultad
concreta se toma a ojo.

## What Changes

- El ADMIN puede fijar una **meta de matriculados por facultad**: un número entero positivo que
  expresa cuántos aspirantes espera ver aprobados en esa facultad. Fijar la meta es editarla: no
  hay historial ni versiones.
- Una facultad puede no tener meta. Ese es su estado inicial y es válido; se muestra como «sin
  meta definida», no como meta cero.
- Aparece una **pestaña nueva en el panel de administración** (`/admin/metas`) que lista todas las
  facultades activas con su meta, cuántos matriculados llevan y el avance entre ambos.
- «Matriculados» se cuenta como las inscripciones en estado `APPROVED` cuyo programa pertenece a
  esa facultad. Se deriva en cada consulta; no se guarda ningún contador.
- Nada de esto es visible ni editable para APPLICANT, STUDENT ni DEAN.

### Supuestos

- **La meta es global por facultad, no por periodo académico.** Es una decisión explícita del
  usuario para mantener el change corto. Su consecuencia aceptada: el conteo de matriculados suma
  todos los periodos, así que al abrir un semestre nuevo la meta no se reinicia y el porcentaje
  sigue creciendo. Atarla al periodo es un change posterior y exigiría reescribir la clave del
  modelo.
- El porcentaje de avance puede pasar del 100 %. Se muestra tal cual, sin recortarlo: una facultad
  que superó su meta es información útil, no un error.
- Las facultades inactivas (`isActive = false`) no aparecen en la pestaña, igual que no aparecen en
  el resto de listados del catálogo.

## Fuera de alcance

- Metas por periodo académico, por programa o por decano.
- Historial de metas, auditoría de quién las cambió o cuándo.
- Alertas, notificaciones o correos cuando una facultad se acerca o se pasa de su meta.
- Que el DEAN vea la meta de su propia facultad.
- Gráficas; la pestaña es una tabla con una barra de avance simple.
- Exportar el reporte a CSV o PDF.

## Capabilities

### New Capabilities

- `enrollment-goals`: fijar y consultar la meta de matriculados de cada facultad, y ver el avance
  real contra esa meta desde el panel de administración.

### Modified Capabilities

Ninguna. El change no altera ningún requisito existente: no toca transiciones de estado, ni
permisos de los endpoints ya definidos, ni el catálogo académico.

## Impact

- **Base de datos**: modelo nuevo `FacultyEnrollmentGoal`, con migración de Prisma. Ninguna tabla
  existente cambia de forma.
- **Contratos**: esquemas Zod y DTOs nuevos en `packages/contracts` para la meta y para la fila del
  reporte de avance.
- **Backend**: módulo nuevo `apps/api/src/modules/goals/` con sus capas, montado bajo las rutas de
  administración y con el guard de rol ADMIN.
- **Frontend**: feature nueva `apps/web/src/features/goals/`, una ruta hija más en la zona de
  administración del router y un enlace más en la navegación del panel.
- **Configuración**: ninguna variable de entorno nueva.
- **Dependencias**: ninguna.
