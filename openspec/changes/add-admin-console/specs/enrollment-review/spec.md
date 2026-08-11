## Purpose

Le da al administrador de admisiones lo que necesita para responder: ver qué inscripciones
esperan, tomarlas para trabajarlas, mirar lo que el aspirante declaró y adjuntó, y decidir si
entra o si tiene que corregir.

## ADDED Requirements

### Requirement: El administrador ve las inscripciones que esperan respuesta

El sistema SHALL ofrecer al rol ADMIN un listado de inscripciones paginado, con filtro por
estado y por periodo académico, mostrando de cada una a quién pertenece, a qué programa aspira,
en qué estado está y si su pago consta verificado.

Este listado SHALL estar reservado al rol ADMIN.

#### Scenario: Bandeja de inscripciones

- **WHEN** un administrador abre la bandeja
- **THEN** ve las inscripciones con el aspirante, el programa, el estado y el estado del pago

#### Scenario: Filtro por estado

- **WHEN** un administrador filtra por las que están enviadas
- **THEN** solo ve esas, y no las que siguen sin enviar

#### Scenario: Las inscripciones sin enviar no aparecen por defecto

- **WHEN** un administrador abre la bandeja sin filtrar
- **THEN** no ve las inscripciones que los aspirantes todavía están diligenciando, porque
  todavía no se ha pedido nada sobre ellas

#### Scenario: Un rol no autorizado intenta abrirla

- **WHEN** una persona con rol APPLICANT o STUDENT, o alguien sin sesión, intenta abrir la
  bandeja
- **THEN** se rechaza por falta de permisos, sin devolver ninguna inscripción

### Requirement: El administrador alcanza cualquier inscripción

El rol ADMIN SHALL poder consultar el detalle de cualquier inscripción y abrir sus documentos
adjuntos, con independencia de a quién pertenezcan. Es la excepción declarada a la regla de que
cada quien solo ve lo suyo.

#### Scenario: Detalle de una inscripción ajena

- **WHEN** un administrador abre el detalle de la inscripción de un aspirante cualquiera
- **THEN** ve todos los datos que este declaró, sus documentos y su recibo

#### Scenario: Abre un documento adjunto

- **WHEN** un administrador abre un documento de la inscripción que está revisando
- **THEN** puede verlo, mediante un acceso temporal como el de su propio dueño

#### Scenario: La excepción no alcanza a otros roles

- **WHEN** una persona con rol APPLICANT intenta abrir el detalle de una inscripción ajena
- **THEN** la respuesta es la misma que si esa inscripción no existiera

### Requirement: El administrador toma una inscripción para revisarla

El sistema SHALL permitir al rol ADMIN tomar una inscripción enviada, lo que la pasa a estado de
revisión y deja constancia de quién la tomó y cuándo. El aspirante SHALL ver reflejado ese
avance en su proceso.

#### Scenario: Se toma una inscripción enviada

- **WHEN** un administrador toma para revisión una inscripción enviada
- **THEN** queda en revisión, a nombre de quien la tomó, y su aspirante lo ve así al consultar
  su proceso

#### Scenario: Se intenta tomar una que no está enviada

- **WHEN** un administrador intenta tomar una inscripción que sigue sin enviarse o que ya fue
  resuelta
- **THEN** la operación se rechaza y el estado no cambia

### Requirement: Aprobar una inscripción convierte al aspirante en estudiante

El sistema SHALL permitir al rol ADMIN aprobar una inscripción cuyo pago conste verificado. La
aprobación y el cambio de rol del aspirante a STUDENT SHALL ocurrir como una sola operación: no
SHALL poder quedar una inscripción aprobada cuyo aspirante siga sin ser estudiante, ni al revés.

#### Scenario: Aprobación con el pago verificado

- **WHEN** un administrador aprueba una inscripción cuyo pago consta verificado
- **THEN** la inscripción queda aprobada y su aspirante pasa a tener el rol de estudiante

#### Scenario: El aspirante lo ve en su siguiente ingreso

- **WHEN** una persona cuya inscripción fue aprobada vuelve a iniciar sesión
- **THEN** entra a la zona de estudiante, y ve su inscripción en solo lectura

#### Scenario: Aprobación sin el pago verificado

- **WHEN** un administrador intenta aprobar una inscripción cuyo pago sigue pendiente
- **THEN** la operación se rechaza indicando que falta verificar el pago, la inscripción no
  cambia de estado y el aspirante conserva su rol

#### Scenario: Nada queda a medias

- **WHEN** la aprobación no puede completarse por cualquier motivo
- **THEN** ni la inscripción queda aprobada ni el rol cambia

#### Scenario: Un rol no autorizado intenta aprobar

- **WHEN** una persona con rol APPLICANT o STUDENT intenta aprobar una inscripción
- **THEN** se rechaza por falta de permisos y nada cambia

### Requirement: Rechazar exige explicar por qué

El sistema SHALL permitir al rol ADMIN rechazar una inscripción indicando obligatoriamente un
motivo escrito, que SHALL quedar visible para el aspirante. Un rechazo SHALL NOT poder guardarse
sin motivo.

#### Scenario: Rechazo con motivo

- **WHEN** un administrador rechaza una inscripción escribiendo el motivo
- **THEN** la inscripción queda rechazada, y su aspirante lee ese motivo al consultar su proceso

#### Scenario: Rechazo sin motivo

- **WHEN** un administrador intenta rechazar una inscripción sin escribir un motivo, o
  escribiendo solo espacios
- **THEN** la operación se rechaza y la inscripción no cambia de estado

#### Scenario: El aspirante puede corregir después

- **WHEN** un aspirante cuya inscripción fue rechazada la corrige y la reenvía
- **THEN** vuelve a aparecer en la bandeja como enviada, lista para revisarse de nuevo

#### Scenario: Una aprobada no se rechaza después

- **WHEN** un administrador intenta rechazar una inscripción ya aprobada
- **THEN** la operación se rechaza y la inscripción sigue aprobada
