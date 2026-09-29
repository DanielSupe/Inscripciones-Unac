## Why

Hoy el decano solo puede firmar al final del embudo: la inscripción tiene que haber pasado por la
entrevista declarada como realizada y el pago tiene que constar verificado. Ese candado supone que
la decisión académica siempre llega después de la cita, y no siempre es así: el decano ya conoce al
aspirante, el cupo está resuelto, o el semestre arranca y no hay agenda que alcance.

Cuando la decisión ya está tomada, el sistema obliga a fingir el camino —agendar una cita que nadie
va a celebrar y declararla realizada— solo para habilitar el botón. Eso ensucia el historial de
entrevistas, que es justamente lo que después justifica una decisión. Este change le da al decano
la vía directa: si la inscripción ya está en sus manos, puede aprobarla cuando quiera.

## What Changes

- **El DEAN aprueba en cualquier punto de su tramo.** Puede aprobar una inscripción de su facultad
  que esté a la espera de entrevista, con entrevista agendada o con entrevista realizada. Deja de
  exigirse que la entrevista conste celebrada.
- **BREAKING**: la aprobación **deja de exigir que el pago esté verificado**. La decisión académica
  deja de depender de un trámite que el ADMIN puede deshacer. La entrega del ADMIN al decano sigue
  exigiéndolo, así que el pago sin verificar solo alcanza a los casos en que la verificación se
  revirtió después de entregar.
- **Una entrevista pendiente se cierra sola al aprobar.** Si la inscripción tenía cita agendada, esa
  cita queda cerrada como anulada, con su fecha y su constancia. No desaparece ni queda viva
  eternamente esperando un resultado que ya no va a llegar.
- **El aspirante ve la aprobación directa.** Su proceso le dice que la facultad lo aprobó y cuándo,
  aunque nunca hubiera llegado a tener entrevista, y deja de pedirle que se presente a una cita que
  ya no existe.
- El resto del reparto de manos **no se toca**: el ADMIN sigue sin poder aprobar, el decano sigue
  alcanzando únicamente su facultad, y la aprobación sigue siendo lo único que convierte a un
  APPLICANT en STUDENT, en una sola operación indivisible.

### Fuera de alcance

- Aprobar antes de la entrega del ADMIN. Una inscripción que sigue en borrador, enviada sin tomar o
  en revisión no es alcanzable por el decano, y este change no la hace alcanzable.
- Devolverle al ADMIN la facultad de aprobar. Sigue sin poder.
- El **rechazo** del decano, que conserva sus momentos actuales: tras la entrevista realizada o tras
  una inasistencia. Este change abre el atajo solo para el sí.
- Pedirle al decano un motivo escrito de la aprobación directa, o distinguir en el registro una
  aprobación con entrevista de una sin ella más allá de lo que ya cuenta el historial de citas.
- Cobrar o conciliar después un pago que quedó pendiente al aprobar. Nadie persigue ese recibo.
- Cualquier aviso fuera de la aplicación. El aspirante se entera al entrar, como en todo el resto
  del sistema.
- Aprobaciones en lote desde la bandeja del decano. Se aprueba de una en una.

### Supuestos

- Que el decano pueda saltarse la entrevista no la vuelve opcional: sigue siendo el camino normal, y
  el atajo es la excepción que el decano decide tomar.
- Una inscripción en manos del decano con el pago pendiente solo puede darse si el ADMIN deshizo una
  verificación después de haber entregado. Se asume que en ese caso manda la decisión académica y el
  problema del recibo se resuelve por fuera del sistema.
- Una entrevista anulada por aprobación directa no cuenta como inasistencia ni como celebrada. Es un
  tercer desenlace y se registra como tal.
- El proceso del aspirante no necesita explicarle por qué no hubo entrevista. Le basta con saber que
  fue aprobado y desde cuándo.

## Capabilities

### Modified Capabilities

- `enrollment-review`: la aprobación del decano deja de exigir entrevista realizada y pago
  verificado; basta con que la inscripción esté en su tramo y sea de su facultad.
- `enrollment-submission`: el camino previsto admite el atajo del decano desde cualquiera de los
  tres estados de su tramo, y el aspirante ve la aprobación que llega sin entrevista.
- `interview-scheduling`: una entrevista agendada deja de bloquear la decisión, y se cierra como
  anulada cuando la aprobación llega antes que la cita.
- `payment-receipt`: la verificación del pago deja de ser requisito para aprobar; sigue siéndolo
  para que el ADMIN entregue al decano.

## Impact

Cambio corto, pero toca el guardián de transiciones y el esquema.

- **Migración.** Enum `InterviewOutcome` gana el valor de entrevista anulada.
- **Transiciones.** El guardián admite `PENDING_INTERVIEW → APPROVED` e `INTERVIEW_SCHEDULED →
  APPROVED`, además del `INTERVIEW_HELD → APPROVED` que ya existía.
- `apps/api`: el service de revisión suelta las dos precondiciones de la aprobación y cierra la
  entrevista vigente dentro de la misma transacción que aprueba y promueve el rol.
- `apps/web`: la bandeja y el detalle del decano ofrecen aprobar en los tres estados; el proceso del
  aspirante contempla la aprobación llegada sin entrevista.
- `openspec/config.yaml`: la línea de contexto que declara «Aprobar exige que el pago esté VERIFIED»
  deja de ser cierta y se corrige, porque es una decisión cerrada que este change reabre.
- Sin variables de entorno nuevas.
