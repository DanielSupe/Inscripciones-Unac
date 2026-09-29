## Context

Ver proposal.md — Why. Lo que condiciona el cómo es dónde vive hoy cada candado de la aprobación,
porque están repartidos en tres sitios de distinta naturaleza:

- `enrollment.transitions.ts` declara `approve` como `INTERVIEW_HELD → APPROVED` para el rol DEAN.
  Es una función pura: solo sabe de estados y roles.
- `enrollmentRepository.approveAndPromote` comprueba dentro de la transacción que el recibo esté
  `VERIFIED` y que exista una entrevista con resultado `HELD`, y devuelve un resultado negativo con
  el motivo.
- `enrollment.review.service.ts` traduce ese motivo a un `ConflictError` con su mensaje.

Las dos comprobaciones de datos están en el repositorio y no en el service porque tenían que ocurrir
dentro de la misma transacción que aprueba y promueve el rol. Este change las elimina, así que esa
tensión con las reglas de capas desaparece sola.

`Interview.outcome` es hoy `HELD | NO_SHOW`, nulo mientras la cita sigue en pie; el mapper expone
como `interview` la que sigue abierta y como `pastInterviews` las cerradas.

## Goals / Non-Goals

**Goals:**

- Que el atajo del decano quede declarado en el mismo sitio que el resto del camino, y no como un
  condicional suelto en el service.
- Que aprobar, promover el rol y cerrar la cita pendiente sigan siendo una sola operación atómica.
- Que anular una cita sea distinguible de una inasistencia en el historial y en la interfaz.

**Non-Goals:**

- Rediseñar el guardián de transiciones ni el reparto de manos entre ADMIN y DEAN.
- Tocar el flujo de rechazo, que conserva sus estados de origen.
- Introducir un registro de auditoría más allá de lo que ya guardan `decidedAt` y `decidedByUserId`.

## Decisions

### El atajo se declara en la tabla de transiciones, no en el service

`approve` pasa a admitir `from: ['PENDING_INTERVIEW', 'INTERVIEW_SCHEDULED', 'INTERVIEW_HELD']`, que
son exactamente los mismos estados de origen que ya tiene `rejectByDean`. El mensaje de rechazo pasa
a hablar de estar en manos de la facultad, no de la entrevista.

La alternativa era dejar `approve` como estaba y añadir una acción `approveDirectly`. Se descarta:
serían dos acciones con el mismo rol, el mismo destino y el mismo efecto, distinguidas solo por el
estado de origen —justo la regla implícita que el comentario de cabecera de ese archivo dice que el
archivo existe para evitar—. Además obligaría al frontend a elegir endpoint según el estado.

### Las dos precondiciones se eliminan, no se vuelven opcionales

`approveAndPromote` deja de consultar el recibo y la entrevista, y deja de devolver un resultado con
motivo: su firma pasa a no devolver nada, y el `if (!result.ok)` del service desaparece con ella. No
se conserva un parámetro tipo `force`, porque no hay ningún llamador que quiera la versión estricta:
el ADMIN no aprueba, y para el DEAN la regla nueva es la única regla.

### Anular es un tercer valor del resultado de la entrevista, no un borrado ni un `HELD` piadoso

`InterviewOutcome` gana `CANCELLED`. Las alternativas consideradas:

- **Borrar la entrevista.** Contradice el requisito vigente de conservar el historial de citas.
- **Dejarla abierta.** El aspirante seguiría viéndose citado después de aprobado, y `interview`
  seguiría devolviendo una cita vigente sobre una inscripción resuelta.
- **Marcarla `HELD`.** Falsea el historial: diría que hubo una entrevista que nunca ocurrió, que es
  exactamente el problema que este change viene a quitar de en medio.

Como el mapper define `interview` por `outcome === null`, cerrarla con `CANCELLED` la mueve sola a
`pastInterviews` sin tocar el mapper.

### El cierre de la cita ocurre dentro de la transacción de aprobación

`approveAndPromote` añade un `updateMany` sobre las entrevistas de esa inscripción con `outcome`
nulo, fijándolas en `CANCELLED`. `updateMany` y no `update` para no depender de que exista: si la
inscripción se aprueba desde `PENDING_INTERVIEW` no hay ninguna, y afectar a cero filas es el
resultado correcto, no un error.

Va en la misma transacción que el `update` del estado y el del rol, por la misma razón que ellos dos:
una inscripción aprobada con una cita viva es un estado inconsistente visible para el aspirante.

### El frontend del decano habilita aprobar en los tres estados

`dean-detail.tsx` condiciona hoy el botón a `status === 'INTERVIEW_HELD'`. Pasa a condicionarlo a que
la inscripción esté en el tramo del decano y sin resolver, que es la condición que ya calcula
`resuelta`. Cuando haya cita agendada, el botón advierte que aprobar la deja sin efecto: es una
consecuencia que no se deduce de la palabra «Aprobar».

### El panel del aspirante distingue la aprobación sin entrevista

`process-panel.tsx` mantiene el texto de `APPROVED`, y le añade la fecha de la decisión. La cita
anulada aparece en el bloque que ya existe para las cerradas, con su etiqueta propia. El aviso de «la
facultad te asignará fecha» ya está condicionado a `status === 'PENDING_INTERVIEW'`, de modo que
desaparece solo al aprobar; se verifica con una prueba en vez de darlo por hecho.

## Risks / Trade-offs

- **Un decano aprueba por error lo que quería agendar** → El botón deja de estar protegido por el
  estado, así que la protección pasa a ser la confirmación explícita en la interfaz, con mención de
  la cita que se anula cuando la hay. No hay deshacer: aprobar promueve el rol y este change no abre
  el camino de vuelta, igual que hoy.
- **Queda un aprobado con el pago sin verificar** → Es la consecuencia aceptada del change. El recibo
  conserva su estado y sigue siendo consultable, de modo que el caso es detectable filtrando pagos
  pendientes; nadie los persigue desde el sistema (proposal.md — Fuera de alcance).
- **El historial de entrevistas gana un valor que los consumidores no esperan** → `InterviewOutcome`
  es un enum compartido en `packages/contracts`; al añadir `CANCELLED` el chequeo de tipos señala
  todos los sitios que lo interpretan, siempre que no haya `default` silencioso en los mapeos de
  etiqueta. Se revisan los mapas de etiquetas antes de cerrar la tarea.

## Migration Plan

Una migración de Prisma que añade `CANCELLED` a `InterviewOutcome`. Es aditiva sobre un enum: no
reescribe filas y no necesita respaldo de datos. Las entrevistas existentes conservan su valor.

Revertir exige que ninguna fila haya quedado en `CANCELLED`, así que el retroceso realista es
redesplegar el código anterior dejando el valor del enum en la base de datos, donde no molesta.

## Open Questions

- Si con el tiempo conviene que la bandeja del decano marque de algún modo las inscripciones que
  aprobó sin entrevista. No cambia specs ni tareas: el dato queda registrado en el historial de
  citas, y la vista puede añadirse después.
