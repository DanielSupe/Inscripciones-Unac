# enrollment-submission Specification

## Purpose
Permite que un aspirante diligencie su inscripción a lo largo de varias sesiones, la envíe cuando
esté completa, siga su avance y la corrija si se la rechazan, sin que nadie más pueda ver ni
tocar lo suyo.
## Requirements
### Requirement: La inscripción se diligencia por pasos y se guarda en cada uno

El sistema SHALL permitir avanzar por la inscripción en pasos, guardando lo diligenciado en cada
uno sin exigir que los siguientes estén completos. Una inscripción a medias SHALL poder retomarse
más tarde con todo lo escrito intacto.

Los pasos SHALL ser tres: los datos personales de quien se inscribe, el programa al que aspira, y
los documentos que la universidad exige. El sistema SHALL NOT pedir datos académicos que ya
consten en un documento adjunto: exigir la misma información dos veces solo añade un sitio donde
equivocarse.

#### Scenario: Se guarda un paso y se abandona

- **WHEN** un aspirante completa el primer paso, lo guarda y cierra el navegador
- **THEN** al volver a entrar encuentra su inscripción donde la dejó, con los datos que había
  escrito

#### Scenario: Un paso incompleto no bloquea el guardado

- **WHEN** un aspirante guarda un paso habiendo dejado campos por llenar
- **THEN** lo escrito se conserva y se le indica qué falta, sin perder nada

#### Scenario: Un dato con formato inválido no se guarda

- **WHEN** un aspirante escribe una fecha de nacimiento imposible o un teléfono con letras
- **THEN** se le señala el campo y ese valor no queda guardado

#### Scenario: Se retoma desde el paso pendiente

- **WHEN** un aspirante con una inscripción a medias vuelve a entrar
- **THEN** se le lleva al primer paso que le falta por completar

#### Scenario: No se piden datos que ya vienen en un documento

- **WHEN** un aspirante recorre la inscripción completa
- **THEN** en ningún paso se le pide el puntaje ni el registro de su prueba de estado, porque los
  aporta adjuntando el certificado

### Requirement: Cada aspirante tiene una inscripción por periodo

El sistema SHALL permitir a un aspirante una única inscripción por periodo académico. Iniciar una
inscripción cuando ya existe una para ese periodo SHALL devolver la existente en lugar de crear
otra.

#### Scenario: Se intenta iniciar dos veces en el mismo periodo

- **WHEN** un aspirante que ya tiene una inscripción en el periodo abierto intenta iniciar otra
- **THEN** se le lleva a la que ya tenía, sin crear una segunda

#### Scenario: Un periodo distinto admite una inscripción nueva

- **WHEN** un aspirante rechazado en un periodo se inscribe en el siguiente
- **THEN** puede crear una inscripción nueva, y la anterior se conserva tal como quedó

### Requirement: La inscripción se envía solo cuando está completa

El sistema SHALL rechazar el envío de una inscripción a la que le falten datos obligatorios o
documentos exigidos, indicando qué falta. Al enviarse con éxito SHALL quedar fuera del alcance de
edición del aspirante.

#### Scenario: Envío con todo completo

- **WHEN** un aspirante envía su inscripción con todos los datos y documentos
- **THEN** la inscripción queda enviada y se le confirma, indicándole que ahora será revisada

#### Scenario: Envío con datos faltantes

- **WHEN** un aspirante intenta enviar una inscripción a la que le faltan datos obligatorios
- **THEN** el envío se rechaza señalando qué falta, y la inscripción sigue siendo editable

#### Scenario: Envío con documentos faltantes

- **WHEN** un aspirante intenta enviar una inscripción sin alguno de los documentos exigidos
- **THEN** el envío se rechaza indicando qué documento falta

#### Scenario: Edición después de enviar

- **WHEN** un aspirante intenta modificar su inscripción ya enviada
- **THEN** la modificación se rechaza y los datos permanecen como se enviaron

#### Scenario: Envío por segunda vez

- **WHEN** un aspirante intenta enviar una inscripción que ya está enviada
- **THEN** la operación se rechaza sin alterar nada ni emitir un recibo nuevo

### Requirement: El avance de la inscripción sigue un camino definido

El sistema SHALL permitir únicamente las transiciones previstas del proceso, y SHALL rechazar
cualquier otra. El estado SHALL NOT poder fijarse directamente desde una petición.

El camino previsto es: diligenciando → enviada → en revisión → **a la espera de entrevista → con
entrevista agendada → con entrevista realizada** → aprobada o rechazada. Desde rechazada se
vuelve a diligenciando para corregir, y desde una inasistencia se vuelve a la espera de
entrevista.

Cada tramo tiene su dueño: el aspirante envía, el ADMIN toma y entrega, y el DEAN agenda,
declara el resultado de la entrevista y decide. Se puede rechazar en dos puntos —en revisión por
el ADMIN, y en manos del DEAN— y en ningún otro.

#### Scenario: Transición no prevista

- **WHEN** se intenta llevar una inscripción de diligenciando a aprobada sin pasar por revisión
- **THEN** la operación se rechaza y el estado no cambia

#### Scenario: No se salta la entrevista

- **WHEN** se intenta aprobar una inscripción que acaba de entregarse al decano, sin entrevista
  agendada ni realizada
- **THEN** la operación se rechaza y el estado no cambia

#### Scenario: No se agenda antes de la entrega

- **WHEN** se intenta agendar la entrevista de una inscripción que el administrador todavía tiene
  en revisión
- **THEN** la operación se rechaza y el estado no cambia

#### Scenario: El estado no es un campo escribible

- **WHEN** una petición de guardado incluye el estado de la inscripción entre sus datos
- **THEN** el estado enviado se ignora y la inscripción conserva el suyo

#### Scenario: Entregar exige que el pago esté verificado

- **WHEN** se intenta entregar al decano una inscripción cuyo recibo todavía no consta como pagado
- **THEN** la entrega se rechaza indicando que falta verificar el pago

#### Scenario: Aprobar exige que el pago siga verificado

- **WHEN** se intenta aprobar una inscripción cuyo recibo no consta como pagado
- **THEN** la aprobación se rechaza indicando que falta verificar el pago

#### Scenario: Una inasistencia devuelve el proceso a esperar fecha

- **WHEN** el decano declara que el aspirante no asistió a su entrevista
- **THEN** la inscripción vuelve a estar a la espera de entrevista, y no queda ni aprobada ni
  rechazada por ese solo hecho

### Requirement: El aspirante consulta el avance de su proceso

El sistema SHALL mostrar al aspirante en qué punto está su inscripción y qué se espera de él a
continuación, **en cada uno de los estados del proceso**, sin dejar ninguno sin explicación. Si
fue rechazada SHALL mostrarle el motivo escrito por quien la rechazó.

Cuando el proceso dependa de otra persona, el sistema SHALL decirlo así, para que el silencio no
se confunda con un trámite olvidado. Cuando dependa del aspirante —presentarse a una entrevista—
SHALL decirle exactamente cuándo y cómo.

#### Scenario: Inscripción en revisión

- **WHEN** un aspirante consulta su proceso tras enviar
- **THEN** ve que está en revisión y que no tiene nada que hacer por ahora

#### Scenario: Documentos y pago conformes

- **WHEN** un aspirante consulta su proceso después de que el administrador entregara su
  inscripción al decano
- **THEN** ve que sus documentos y su pago quedaron conformes, y que espera fecha de entrevista
  con la facultad

#### Scenario: Entrevista agendada

- **WHEN** un aspirante consulta su proceso con la entrevista ya agendada
- **THEN** ve el día, la hora y cómo asistir, presentado en la hora de Colombia

#### Scenario: Entrevista realizada

- **WHEN** un aspirante consulta su proceso después de que el decano declarara realizada la
  entrevista
- **THEN** ve que se realizó y que espera la decisión de la facultad

#### Scenario: No se presentó

- **WHEN** un aspirante consulta su proceso después de que el decano registrara su inasistencia
- **THEN** ve que no se registró su asistencia y que espera una fecha nueva

#### Scenario: Inscripción rechazada

- **WHEN** un aspirante consulta su proceso después de que le rechazaran la inscripción
- **THEN** ve que fue rechazada y lee el motivo, junto con la indicación de que puede corregir y
  reenviar

#### Scenario: Inscripción aprobada

- **WHEN** un aspirante consulta su proceso después de que le aprobaran la inscripción
- **THEN** ve que fue aprobada

### Requirement: Una inscripción rechazada se corrige y se reenvía

El sistema SHALL permitir al aspirante volver a editar una inscripción rechazada y enviarla de
nuevo. Al reenviarla, el motivo del rechazo anterior SHALL dejar de mostrarse como vigente.

#### Scenario: Se corrige y se reenvía

- **WHEN** un aspirante con una inscripción rechazada corrige lo señalado y la envía otra vez
- **THEN** la inscripción vuelve a quedar enviada, a la espera de revisión

#### Scenario: No se emite un recibo nuevo al reenviar

- **WHEN** un aspirante reenvía una inscripción que ya tenía recibo emitido
- **THEN** conserva el recibo original y no se emite otro

#### Scenario: Una inscripción aprobada no se reabre

- **WHEN** un aspirante intenta volver a editar una inscripción ya aprobada
- **THEN** la operación se rechaza y la inscripción permanece aprobada

### Requirement: Cada quien ve únicamente su propia inscripción

El sistema SHALL resolver toda operación sobre una inscripción contra la persona de la sesión.
Un aspirante SHALL NOT poder consultar, modificar ni enviar la inscripción de otro, ni siquiera
indicando su identificador directamente.

#### Scenario: Se pide la inscripción de otro

- **WHEN** un aspirante pide una inscripción que no es suya usando su identificador
- **THEN** la respuesta es la misma que si esa inscripción no existiera

#### Scenario: Se modifica la inscripción de otro

- **WHEN** un aspirante intenta guardar datos en la inscripción de otro
- **THEN** la operación se rechaza y la inscripción ajena queda intacta

#### Scenario: Un estudiante consulta la suya

- **WHEN** una persona con rol STUDENT consulta la inscripción que le aprobaron
- **THEN** puede verla en solo lectura, sin poder modificarla

#### Scenario: Alguien sin sesión pide una inscripción

- **WHEN** se pide una inscripción sin haber iniciado sesión
- **THEN** se rechaza por falta de sesión, sin revelar si esa inscripción existe

