## ADDED Requirements

### Requirement: El administrador verifica el pago de un recibo

El sistema SHALL permitir al rol ADMIN marcar el pago de un recibo como verificado, dejando
constancia de quién lo verificó y cuándo. La verificación SHALL ser reversible únicamente por el
mismo rol, y el aspirante SHALL ver el cambio reflejado en su recibo.

#### Scenario: Se verifica un pago

- **WHEN** un administrador marca como verificado el pago de un recibo pendiente
- **THEN** el recibo queda verificado, con constancia de quién lo hizo y cuándo, y su aspirante
  lo ve así

#### Scenario: Verificar dos veces no cambia nada

- **WHEN** un administrador marca como verificado un pago que ya lo estaba
- **THEN** la operación termina sin error y no se altera quién lo verificó originalmente

#### Scenario: Se deshace una verificación equivocada

- **WHEN** un administrador devuelve a pendiente un pago que había verificado por error
- **THEN** el recibo vuelve a constar como pendiente, y una inscripción que dependiera de él ya
  no puede aprobarse

#### Scenario: Un rol no autorizado intenta verificar

- **WHEN** una persona con rol APPLICANT o STUDENT intenta marcar su propio pago como verificado
- **THEN** se rechaza por falta de permisos y el recibo sigue pendiente

### Requirement: El recibo señala cuándo se venció

Un recibo cuyo pago siga pendiente después de su fecha de vencimiento SHALL mostrarse como
vencido, tanto al aspirante como al administrador. El vencimiento SHALL NOT anular por sí solo
la inscripción ni impedir que el pago se verifique más tarde.

#### Scenario: El aspirante ve su recibo vencido

- **WHEN** un aspirante consulta un recibo cuya fecha de pago ya pasó y sigue pendiente
- **THEN** ve que está vencido, junto con la fecha en que venció

#### Scenario: El administrador lo distingue en la bandeja

- **WHEN** un administrador revisa inscripciones cuyos recibos vencieron
- **THEN** puede distinguirlas de aquellas cuyo pago sigue dentro de plazo

#### Scenario: Un pago tardío se puede verificar igual

- **WHEN** un administrador verifica el pago de un recibo ya vencido
- **THEN** la verificación se acepta, porque la decisión de admitir un pago tardío corresponde a
  una persona y no a una fecha

#### Scenario: Un recibo verificado no vence

- **WHEN** pasa la fecha de vencimiento de un recibo cuyo pago ya estaba verificado
- **THEN** no se muestra como vencido
