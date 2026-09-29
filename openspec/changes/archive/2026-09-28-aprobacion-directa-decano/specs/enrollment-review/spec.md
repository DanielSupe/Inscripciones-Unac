## MODIFIED Requirements

### Requirement: Aprobar una inscripción convierte al aspirante en estudiante

El sistema SHALL permitir **al rol DEAN** aprobar una inscripción de su facultad en **cualquier
punto de su tramo**: a la espera de entrevista, con entrevista agendada o con entrevista realizada.
La aprobación SHALL NOT exigir que la entrevista conste realizada, ni que el pago conste verificado.

La aprobación y el cambio de rol del aspirante a STUDENT SHALL ocurrir como una sola operación: no
SHALL poder quedar una inscripción aprobada cuyo aspirante siga sin ser estudiante, ni al revés.

Una inscripción que el ADMIN todavía no ha entregado —diligenciándose, enviada o en revisión— SHALL
NOT poder aprobarse: sigue sin estar en manos del decano. Una ya resuelta —aprobada o rechazada—
tampoco.

El rol ADMIN SHALL NOT poder aprobar. Es la decisión académica, y la firma quien responde por el
programa.

#### Scenario: Aprobación tras la entrevista

- **WHEN** un decano aprueba una inscripción de su facultad cuya entrevista consta realizada
- **THEN** la inscripción queda aprobada y su aspirante pasa a tener el rol de estudiante

#### Scenario: Aprobación sin entrevista, recién entregada

- **WHEN** un decano aprueba una inscripción de su facultad que acaba de recibir y que todavía no
  tiene fecha de entrevista
- **THEN** la inscripción queda aprobada y su aspirante pasa a tener el rol de estudiante, sin que
  haya hecho falta agendar ni celebrar ninguna cita

#### Scenario: Aprobación con la entrevista todavía por delante

- **WHEN** un decano aprueba una inscripción de su facultad cuya entrevista está agendada para una
  fecha futura
- **THEN** la inscripción queda aprobada, su aspirante pasa a ser estudiante y esa cita deja de
  estar pendiente

#### Scenario: Aprobación con el pago pendiente

- **WHEN** un decano aprueba una inscripción de su facultad cuyo recibo no consta pagado
- **THEN** la inscripción queda aprobada igualmente y su aspirante pasa a ser estudiante

#### Scenario: El aspirante lo ve en su siguiente ingreso

- **WHEN** una persona cuya inscripción fue aprobada vuelve a iniciar sesión
- **THEN** entra a la zona de estudiante, y ve su inscripción en solo lectura

#### Scenario: Aprobación de una que todavía no le han entregado

- **WHEN** un decano intenta aprobar una inscripción de su facultad que el administrador conserva
  en revisión o que el aspirante aún no ha enviado
- **THEN** la operación se rechaza y el estado no cambia

#### Scenario: Aprobación de una ya resuelta

- **WHEN** un decano intenta aprobar una inscripción que ya está aprobada o rechazada
- **THEN** la operación se rechaza y nada cambia

#### Scenario: Nada queda a medias

- **WHEN** la aprobación no puede completarse por cualquier motivo
- **THEN** ni la inscripción queda aprobada, ni el rol cambia, ni la entrevista pendiente se cierra

#### Scenario: El administrador intenta aprobar

- **WHEN** una persona con rol ADMIN intenta aprobar una inscripción
- **THEN** se rechaza por falta de permisos y nada cambia

#### Scenario: Un decano intenta aprobar fuera de su facultad

- **WHEN** un decano intenta aprobar una inscripción cuyo programa pertenece a otra facultad
- **THEN** se le responde igual que si esa inscripción no existiera

#### Scenario: Un rol no autorizado intenta aprobar

- **WHEN** una persona con rol APPLICANT o STUDENT intenta aprobar una inscripción
- **THEN** se rechaza por falta de permisos y nada cambia
