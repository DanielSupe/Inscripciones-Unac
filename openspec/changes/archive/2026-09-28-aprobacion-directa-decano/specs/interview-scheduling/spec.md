## ADDED Requirements

### Requirement: Una aprobación anticipada anula la entrevista pendiente

Cuando el decano apruebe una inscripción que tiene una entrevista agendada, el sistema SHALL cerrar
esa entrevista con el resultado **anulada**, dentro de la misma operación que aprueba. SHALL NOT
quedar una entrevista viva esperando un resultado que ya no va a llegar, ni SHALL borrarse la cita
como si nunca se hubiera fijado.

Una entrevista anulada SHALL NOT contar como realizada ni como inasistencia: es un tercer
desenlace, y el sistema SHALL poder distinguirlo de los otros dos al consultar el historial.

Si la inscripción se aprueba mientras espera fecha, no hay entrevista vigente que cerrar y la
aprobación SHALL completarse igual.

#### Scenario: La decisión llega antes que la cita

- **WHEN** un decano aprueba una inscripción cuya entrevista está agendada
- **THEN** esa entrevista queda cerrada como anulada, conservando su fecha, y la inscripción queda
  aprobada

#### Scenario: Se aprueba sin ninguna cita fijada

- **WHEN** un decano aprueba una inscripción que está a la espera de entrevista
- **THEN** la aprobación se completa sin que haya ninguna entrevista que cerrar

#### Scenario: La anulación no se confunde con una ausencia

- **WHEN** se consulta el historial de un aspirante cuya entrevista se anuló al aprobarlo
- **THEN** esa entrevista consta como anulada, y no como una inasistencia suya

#### Scenario: Una entrevista anulada no se reabre

- **WHEN** un decano intenta mover una entrevista anulada o declarar su resultado
- **THEN** la operación se rechaza: esa cita quedó cerrada con la decisión

## MODIFIED Requirements

### Requirement: La entrevista se puede mover

El sistema SHALL permitir al DEAN cambiar la fecha, la hora, la modalidad y el dato de asistencia
de una entrevista agendada que todavía no se ha cerrado. Mover una entrevista SHALL NOT crear una
cita distinta: sigue siendo la misma, en otro momento.

Una entrevista está cerrada cuando se declaró realizada, cuando se registró la inasistencia del
aspirante, o cuando quedó anulada por una aprobación anticipada.

El aspirante SHALL ver siempre la fecha vigente, nunca una anterior.

#### Scenario: Se cambia la fecha

- **WHEN** un decano cambia la fecha de una entrevista agendada
- **THEN** el aspirante ve la fecha nueva al consultar su proceso, y la anterior deja de mostrarse

#### Scenario: Se cambia de presencial a virtual

- **WHEN** un decano convierte una entrevista presencial en virtual indicando el enlace
- **THEN** la entrevista pasa a ser virtual y el lugar deja de mostrarse

#### Scenario: Una entrevista ya cerrada

- **WHEN** un decano intenta mover una entrevista que ya declaró realizada o no asistida, o que
  quedó anulada al aprobar la inscripción
- **THEN** la operación se rechaza: lo que ya se cerró no se reagenda

### Requirement: El decano declara si la entrevista ocurrió

El sistema SHALL permitir al DEAN declarar una entrevista agendada como **realizada** o como **no
asistida**. Hasta que lo haga, la inscripción SHALL permanecer con su entrevista agendada y SHALL
NOT poder **rechazarse** por la vía académica.

Aprobar es la excepción: el decano SHALL poder aprobar con la entrevista todavía agendada, y esa
aprobación cierra la cita como anulada.

Declararla realizada SHALL llevar la inscripción al estado en que el decano ya puede rechazar.

#### Scenario: La entrevista se realizó

- **WHEN** un decano declara realizada la entrevista de una inscripción de su facultad
- **THEN** la inscripción queda a la espera de la decisión del decano

#### Scenario: No se rechaza con la cita en pie

- **WHEN** un decano intenta rechazar una inscripción cuya entrevista sigue agendada
- **THEN** la operación se rechaza: primero hay que declarar qué pasó con esa cita

#### Scenario: Sí se aprueba con la cita en pie

- **WHEN** un decano aprueba una inscripción cuya entrevista sigue agendada
- **THEN** la inscripción queda aprobada y la cita queda anulada

#### Scenario: Todavía no ocurre

- **WHEN** un decano intenta declarar realizada una entrevista cuya fecha aún no ha llegado
- **THEN** la operación se rechaza: no se puede dar por celebrada una cita futura

#### Scenario: Declararla dos veces

- **WHEN** un decano intenta declarar el resultado de una entrevista que ya lo tiene
- **THEN** la operación se rechaza y el resultado registrado no cambia

### Requirement: El aspirante ve su entrevista

El sistema SHALL mostrar al aspirante, dentro de su proceso, la fecha y la hora de su entrevista
y cómo asistir a ella, en cuanto su decano la fije. La fecha SHALL presentarse en la hora local
de Colombia.

Mientras no haya fecha, el sistema SHALL decirle que está a la espera de que le asignen una, en
lugar de dejar el hueco vacío. Si su inscripción se aprueba sin entrevista, SHALL dejar de
anunciarle esa espera; y si se aprueba con una cita agendada, SHALL decirle que quedó sin efecto en
lugar de seguir citándolo.

Un aspirante SHALL ver únicamente la entrevista de su propia inscripción.

#### Scenario: Todavía sin fecha

- **WHEN** un aspirante consulta su proceso después de que el administrador entregara su
  inscripción
- **THEN** ve que sus documentos y su pago quedaron conformes y que espera fecha de entrevista

#### Scenario: Con fecha asignada

- **WHEN** un aspirante consulta su proceso con la entrevista ya agendada
- **THEN** ve el día, la hora y cómo asistir, sin tener que preguntar por otro canal

#### Scenario: Tras la entrevista

- **WHEN** un aspirante consulta su proceso después de que el decano declarara realizada la
  entrevista
- **THEN** ve que ya se realizó y que espera la decisión

#### Scenario: Aprobado mientras esperaba fecha

- **WHEN** un aspirante consulta su proceso después de que el decano lo aprobara sin haberle
  asignado fecha
- **THEN** ya no se le dice que espere una entrevista

#### Scenario: Aprobado con la cita pendiente

- **WHEN** un aspirante consulta su proceso después de que el decano lo aprobara teniendo cita
  agendada
- **THEN** ve que esa cita quedó sin efecto, y no se le pide presentarse

#### Scenario: La entrevista de otro

- **WHEN** alguien intenta consultar la entrevista de una inscripción que no es suya
- **THEN** se le responde igual que si esa inscripción no existiera
