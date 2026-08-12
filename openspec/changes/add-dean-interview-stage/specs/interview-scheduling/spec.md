## Purpose

La entrevista de admisión: la cita entre el decano y el aspirante, desde que se fija hasta que se
declara ocurrida. Existe como cosa propia y no como un par de campos de la inscripción porque
tiene historia —se mueve, alguien no aparece, se vuelve a poner— y esa historia es justamente lo
que después justifica una decisión.

## ADDED Requirements

### Requirement: El decano agenda la entrevista de un aspirante de su facultad

El sistema SHALL permitir al rol DEAN fijar la fecha y la hora de la entrevista de una
inscripción que esté a la espera de entrevista y pertenezca a **su** facultad.

Una fecha en el pasado SHALL rechazarse: una cita a la que ya no se puede llegar no es una cita.

Un DEAN SHALL NOT poder agendar sobre una inscripción de otra facultad, y el intento SHALL
responderse como si esa inscripción no existiera, sin revelar que existe. Los roles APPLICANT y
STUDENT SHALL NOT poder agendar. El rol ADMIN tampoco: ve la entrevista pero no la fija.

#### Scenario: Se fija la cita

- **WHEN** un decano fija fecha y hora para una inscripción de su facultad que espera entrevista
- **THEN** la inscripción pasa a tener entrevista agendada, y queda constancia de quién la fijó

#### Scenario: Una fecha que ya pasó

- **WHEN** un decano intenta fijar una fecha anterior al momento actual
- **THEN** la operación se rechaza y la inscripción sigue esperando entrevista

#### Scenario: Una inscripción que todavía no llegó

- **WHEN** un decano intenta agendar sobre una inscripción que el administrador aún no ha
  entregado
- **THEN** la operación se rechaza por no corresponder al estado de esa inscripción

#### Scenario: Una inscripción de otra facultad

- **WHEN** un decano intenta agendar la entrevista de una inscripción cuyo programa pertenece a
  otra facultad
- **THEN** se le responde igual que si esa inscripción no existiera

#### Scenario: Un rol no autorizado intenta agendar

- **WHEN** una persona con rol APPLICANT, STUDENT o ADMIN intenta fijar una entrevista
- **THEN** se rechaza por falta de permisos y nada cambia

#### Scenario: Sin sesión

- **WHEN** se intenta agendar una entrevista sin haber iniciado sesión
- **THEN** la operación se rechaza sin revelar nada de la inscripción

### Requirement: La entrevista dice cómo asistir

Toda entrevista SHALL declarar su modalidad: presencial o virtual. Una entrevista presencial
SHALL indicar el lugar; una virtual SHALL indicar el enlace de reunión. El dato que corresponde a
la modalidad SHALL ser obligatorio, porque una cita sin decir dónde no sirve de nada.

#### Scenario: Entrevista presencial

- **WHEN** un decano agenda una entrevista presencial indicando el lugar
- **THEN** queda registrada con su lugar, y el aspirante lo ve junto a la fecha

#### Scenario: Entrevista virtual

- **WHEN** un decano agenda una entrevista virtual indicando el enlace de reunión
- **THEN** queda registrada con su enlace, y el aspirante puede abrirlo desde su proceso

#### Scenario: Falta el dato de la modalidad

- **WHEN** un decano intenta agendar una entrevista presencial sin lugar, o una virtual sin
  enlace, o dejando solo espacios
- **THEN** la operación se rechaza y no queda ninguna entrevista registrada

### Requirement: La entrevista se puede mover

El sistema SHALL permitir al DEAN cambiar la fecha, la hora, la modalidad y el dato de asistencia
de una entrevista agendada que todavía no se ha declarado ocurrida. Mover una entrevista SHALL
NOT crear una cita distinta: sigue siendo la misma, en otro momento.

El aspirante SHALL ver siempre la fecha vigente, nunca una anterior.

#### Scenario: Se cambia la fecha

- **WHEN** un decano cambia la fecha de una entrevista agendada
- **THEN** el aspirante ve la fecha nueva al consultar su proceso, y la anterior deja de mostrarse

#### Scenario: Se cambia de presencial a virtual

- **WHEN** un decano convierte una entrevista presencial en virtual indicando el enlace
- **THEN** la entrevista pasa a ser virtual y el lugar deja de mostrarse

#### Scenario: Una entrevista ya ocurrida

- **WHEN** un decano intenta mover una entrevista que ya declaró realizada o no asistida
- **THEN** la operación se rechaza: lo que ya pasó no se reagenda

### Requirement: El decano declara si la entrevista ocurrió

El sistema SHALL permitir al DEAN declarar una entrevista agendada como **realizada** o como **no
asistida**. Hasta que lo haga, la inscripción SHALL permanecer con su entrevista agendada y
SHALL NOT poder aprobarse ni rechazarse por la vía académica.

Declararla realizada SHALL llevar la inscripción al estado en que el decano ya puede decidir.

#### Scenario: La entrevista se realizó

- **WHEN** un decano declara realizada la entrevista de una inscripción de su facultad
- **THEN** la inscripción queda a la espera de la decisión del decano

#### Scenario: Todavía no ocurre

- **WHEN** un decano intenta declarar realizada una entrevista cuya fecha aún no ha llegado
- **THEN** la operación se rechaza: no se puede dar por celebrada una cita futura

#### Scenario: Declararla dos veces

- **WHEN** un decano intenta declarar el resultado de una entrevista que ya lo tiene
- **THEN** la operación se rechaza y el resultado registrado no cambia

### Requirement: Una inasistencia queda registrada y la inscripción vuelve a esperar

Declarar que el aspirante **no asistió** SHALL cerrar esa entrevista con ese resultado y SHALL
devolver la inscripción a la espera de entrevista, de modo que el decano pueda fijar otra fecha o
rechazar con motivo.

Las entrevistas cerradas SHALL conservarse. El sistema SHALL poder mostrar cuántas veces se citó
a un aspirante y a cuántas faltó, porque una segunda ausencia solo se puede juzgar sabiendo que
hubo una primera.

#### Scenario: El aspirante no se presenta

- **WHEN** un decano declara que el aspirante no asistió
- **THEN** la inscripción vuelve a estar a la espera de entrevista, y esa ausencia queda
  registrada

#### Scenario: Se cita de nuevo

- **WHEN** el decano fija una fecha nueva tras una inasistencia
- **THEN** la inscripción vuelve a tener entrevista agendada, y la ausencia anterior sigue
  constando

#### Scenario: El historial no se pierde

- **WHEN** se consulta una inscripción con varias entrevistas cerradas
- **THEN** se ven todas con su fecha y su resultado, y cuál es la vigente si la hay

### Requirement: El aspirante ve su entrevista

El sistema SHALL mostrar al aspirante, dentro de su proceso, la fecha y la hora de su entrevista
y cómo asistir a ella, en cuanto su decano la fije. La fecha SHALL presentarse en la hora local
de Colombia.

Mientras no haya fecha, el sistema SHALL decirle que está a la espera de que le asignen una, en
lugar de dejar el hueco vacío.

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

#### Scenario: La entrevista de otro

- **WHEN** alguien intenta consultar la entrevista de una inscripción que no es suya
- **THEN** se le responde igual que si esa inscripción no existiera
