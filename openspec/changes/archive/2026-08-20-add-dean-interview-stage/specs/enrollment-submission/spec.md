## MODIFIED Requirements

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
