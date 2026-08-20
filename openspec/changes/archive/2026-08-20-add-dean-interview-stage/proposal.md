## Why

Hoy la admisión la decide una sola persona. El ADMIN verifica el pago, mira los documentos y
aprueba, y con esa aprobación el aspirante pasa a ser estudiante. Es un trámite administrativo
haciendo las veces de decisión académica: quien comprueba que una cédula se lee no es quien puede
juzgar si alguien encaja en un programa de Enfermería.

En la universidad real esa decisión la toma el decano de la facultad, y la toma después de
hablar con la persona. Este change parte el proceso en las dos manos que le corresponden y añade
el paso que hoy falta —la entrevista—, con el aspirante viendo en todo momento en qué punto
está y qué se espera de él.

## What Changes

- Aparece el rol **DEAN**. Cada facultad tiene el suyo, y ambos —facultad y decano— se crean al
  sembrar la base de datos.
- Aparece la **facultad** como entidad del catálogo. Cada programa académico pertenece a una, y
  ese vínculo es lo que decide qué decano recibe cada inscripción.
- **El ADMIN deja de aprobar.** Su trabajo termina al comprobar documentos y pago: entonces
  entrega la inscripción al decano de la facultad del programa elegido. Conserva la facultad de
  **rechazar por un problema de trámite** —un documento ilegible, un pago que nunca llegó— para
  no dejar expedientes defectuosos atascados en la bandeja de nadie.
- **El decano agenda la entrevista** desde la aplicación: fecha, hora y, según la modalidad, un
  lugar o un enlace de reunión. Puede reagendarla.
- Tras la fecha, el decano **marca la entrevista como realizada o como no asistida**. Una
  inasistencia devuelve la inscripción a la espera de entrevista, con constancia de lo ocurrido:
  el decano decide entonces si pone otra fecha o rechaza.
- **El decano aprueba o rechaza**, y solo con la entrevista ya realizada. La aprobación sigue
  siendo lo único que convierte a un APPLICANT en STUDENT, y sigue ocurriendo en una sola
  operación indivisible.
- El **camino de la inscripción se alarga** con tres estados nuevos: a la espera de entrevista,
  con entrevista agendada, y con entrevista realizada.
- El aspirante **ve cada uno de esos pasos** en su proceso, incluida la fecha de su entrevista y
  cómo asistir.
- El ADMIN **conserva visibilidad de solo lectura** sobre todo el proceso, incluida la entrevista
  y la decisión del decano. Es quien atiende el teléfono cuando alguien pregunta cómo va lo suyo.
- El decano **solo alcanza las inscripciones de su facultad**. No es una omisión de la interfaz:
  se comprueba en el servidor.

### Fuera de alcance

- Cualquier aviso fuera de la aplicación. No hay correo en el sistema, así que «estar enterado»
  significa verlo al entrar. Ni el aspirante ni el decano reciben nada por otro canal.
- Disponibilidad del decano en forma de franjas horarias reservables. El decano fija la fecha; el
  aspirante no elige ni confirma.
- Choques de agenda. El sistema no impide que un decano ponga dos entrevistas a la misma hora.
- Notas o acta de la entrevista más allá de marcar si se realizó y del motivo del rechazo.
- Recordatorios, cuenta atrás o caducidad automática de una entrevista sin marcar.
- Que el ADMIN pueda devolver atrás una inscripción ya entregada al decano.
- La gestión de facultades desde la interfaz. Se siembran; no hay CRUD de facultades.
- Reasignar una inscripción a otro decano, o cubrir a un decano ausente.

### Supuestos

- Cada facultad tiene **un** decano y cada decano **una** facultad. No se contempla que dos
  personas compartan facultad ni que una cubra dos.
- Todo programa pertenece a exactamente una facultad. Un programa sin facultad no podría llegar a
  ningún decano, así que el vínculo es obligatorio.
- Las facultades y su reparto de programas se redactan como propuesta y quedan marcadas en la
  semilla como pendientes de confirmar con la UNAC.
- Las fechas de entrevista se guardan en tiempo universal y se presentan en la hora de Colombia,
  que no tiene cambio estacional.
- Un decano eliminado deja su facultad sin quien decida. El change lo hace visible, no lo
  resuelve: es trabajo del turno siguiente.

## Capabilities

### New Capabilities

- `interview-scheduling`: la entrevista de admisión como cita con vida propia — agendarla,
  moverla, declararla realizada o no asistida, su modalidad y cómo la ve el aspirante.

### Modified Capabilities

- `enrollment-review`: quién decide y cuándo. El ADMIN valida y entrega o rechaza por trámite; el
  DEAN decide sobre su facultad tras la entrevista. La aprobación cambia de manos.
- `academic-catalog`: aparece la facultad, cada programa pertenece a una, y facultades y decanos
  se siembran.
- `access-control`: existe el rol DEAN, con su zona propia y su alcance limitado a su facultad.
- `enrollment-submission`: el camino previsto se alarga con los tres estados de la entrevista, y
  el aspirante los ve.

## Impact

Toca las dos aplicaciones y el esquema.

- **Migración.** Enum `Role` con `DEAN`; enum `EnrollmentStatus` con tres valores nuevos; modelo
  `Faculty`; `AcademicProgram.facultyId` obligatorio, lo que exige rellenar los programas ya
  sembrados antes de imponer la restricción; modelo `Interview`; y en `Enrollment`, quién decidió
  y cuándo, separado de quién revisó.
- **Semilla.** Facultades, sus decanos y el reparto de programas. Idempotente, como el admin.
- **Variables de entorno.** Credenciales de los decanos sembrados.
- `apps/api`: el guardián de transiciones crece; módulo nuevo para la entrevista; el módulo de
  catálogo aprende de facultades; la autorización por fila del decano.
- `apps/web`: zona nueva para el rol DEAN; la consola del ADMIN pierde el botón de aprobar y gana
  el de entregar; el proceso del aspirante muestra los estados y la cita.
- `packages/contracts`: los enums nuevos y los esquemas de la entrevista.
