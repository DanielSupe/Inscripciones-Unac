## MODIFIED Requirements

### Requirement: El recibo registra si el pago fue verificado

Un recibo SHALL llevar constancia de si el pago está pendiente o verificado. La verificación SHALL
ser requisito para que el ADMIN entregue la inscripción al decano, y SHALL NOT serlo para que el
decano la apruebe: una vez la inscripción está en su tramo, la decisión académica no depende de un
trámite reversible.

#### Scenario: Recibo recién emitido

- **WHEN** se emite un recibo
- **THEN** queda con el pago pendiente

#### Scenario: El aspirante ve el estado de su pago

- **WHEN** un aspirante consulta su recibo
- **THEN** ve si su pago figura como pendiente o como verificado

#### Scenario: Sin pago verificado no hay entrega al decano

- **WHEN** se intenta entregar al decano una inscripción cuyo recibo sigue con el pago pendiente
- **THEN** la entrega se rechaza indicando que falta verificar el pago

#### Scenario: El pago pendiente no frena la decisión del decano

- **WHEN** un decano aprueba una inscripción de su facultad cuyo recibo consta pendiente
- **THEN** la aprobación se realiza, y el recibo sigue constando pendiente

### Requirement: El administrador verifica el pago de un recibo

El sistema SHALL permitir al rol ADMIN marcar el pago de un recibo como verificado, dejando
constancia de quién lo verificó y cuándo. La verificación SHALL ser reversible únicamente por el
mismo rol, y el aspirante SHALL ver el cambio reflejado en su recibo.

Deshacer una verificación SHALL NOT alterar una inscripción que ya avanzó: ni la devuelve a
revisión, ni impide que su decano decida.

#### Scenario: Se verifica un pago

- **WHEN** un administrador marca como verificado el pago de un recibo pendiente
- **THEN** el recibo queda verificado, con constancia de quién lo hizo y cuándo, y su aspirante
  lo ve así

#### Scenario: Verificar dos veces no cambia nada

- **WHEN** un administrador marca como verificado un pago que ya lo estaba
- **THEN** la operación termina sin error y no se altera quién lo verificó originalmente

#### Scenario: Se deshace una verificación equivocada

- **WHEN** un administrador devuelve a pendiente un pago que había verificado por error
- **THEN** el recibo vuelve a constar como pendiente, y una inscripción que todavía no se hubiera
  entregado ya no puede entregarse al decano

#### Scenario: Deshacerla no le quita la decisión al decano

- **WHEN** un administrador devuelve a pendiente el pago de una inscripción que ya entregó
- **THEN** la inscripción sigue en el tramo del decano, que puede aprobarla igualmente

#### Scenario: Un rol no autorizado intenta verificar

- **WHEN** una persona con rol APPLICANT o STUDENT intenta marcar su propio pago como verificado
- **THEN** se rechaza por falta de permisos y el recibo sigue pendiente
