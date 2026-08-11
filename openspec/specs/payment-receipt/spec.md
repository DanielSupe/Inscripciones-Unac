# payment-receipt Specification

## Purpose
Le entrega al aspirante, en el momento en que termina su inscripción, el documento con el que
puede ir a pagar el derecho de inscripción, y le deja constancia de cuánto, por qué concepto y
hasta cuándo.
## Requirements
### Requirement: El recibo se emite al enviar la inscripción

El sistema SHALL emitir un recibo de pago en el momento en que una inscripción se envía por
primera vez, con el valor vigente del periodo, la fecha de emisión y una fecha de vencimiento
calculada a partir de la configuración.

#### Scenario: Envío exitoso

- **WHEN** un aspirante envía su inscripción completa
- **THEN** queda emitido un recibo asociado a esa inscripción, y se le ofrece consultarlo

#### Scenario: Un envío rechazado no emite recibo

- **WHEN** un intento de envío se rechaza porque falta información
- **THEN** no se emite ningún recibo

#### Scenario: Reenvío tras un rechazo

- **WHEN** un aspirante reenvía una inscripción que ya tenía recibo
- **THEN** conserva el mismo recibo, con su número y su valor originales

#### Scenario: El valor queda congelado

- **WHEN** se cambia el valor del periodo después de emitido un recibo
- **THEN** el recibo emitido conserva el valor con el que se emitió

### Requirement: Cada recibo tiene un número único y verificable

Cada recibo SHALL llevar un número que no se repita, estable en el tiempo, con el que la
universidad pueda identificar el pago cuando el aspirante lo presente.

#### Scenario: Dos recibos no comparten número

- **WHEN** se emiten recibos para inscripciones distintas
- **THEN** cada uno lleva un número distinto

#### Scenario: El número no cambia

- **WHEN** un aspirante consulta su recibo en momentos distintos
- **THEN** el número es siempre el mismo

### Requirement: El recibo se puede consultar y descargar

El sistema SHALL mostrar al aspirante el contenido de su recibo y SHALL permitirle descargarlo
como documento imprimible. El recibo SHALL identificar al aspirante, el programa y periodo a los
que aspira, el concepto, el valor, la fecha de emisión y la de vencimiento.

#### Scenario: Consulta del recibo

- **WHEN** un aspirante con inscripción enviada consulta su recibo
- **THEN** ve su nombre y documento, el programa y periodo, el concepto, el valor, el número, y
  las fechas de emisión y vencimiento

#### Scenario: Descarga del recibo

- **WHEN** un aspirante descarga su recibo
- **THEN** obtiene un documento imprimible con esa misma información

#### Scenario: Todavía no hay recibo

- **WHEN** un aspirante con la inscripción sin enviar intenta consultar su recibo
- **THEN** se le indica que el recibo se emite al terminar la inscripción

### Requirement: El recibo es privado

Un recibo SHALL ser accesible únicamente para el aspirante al que pertenece y para quien revise su
inscripción.

#### Scenario: Se pide el recibo de otro

- **WHEN** un aspirante pide un recibo que no es suyo indicando su identificador
- **THEN** la respuesta es la misma que si ese recibo no existiera

#### Scenario: Se pide un recibo sin sesión

- **WHEN** se pide un recibo sin haber iniciado sesión
- **THEN** se rechaza por falta de sesión, sin revelar si existe

#### Scenario: Un estudiante consulta el suyo

- **WHEN** una persona con rol STUDENT consulta el recibo de la inscripción que le aprobaron
- **THEN** puede verlo y descargarlo

### Requirement: El recibo registra si el pago fue verificado

Un recibo SHALL llevar constancia de si el pago está pendiente o verificado. La verificación
SHALL ser requisito para aprobar la inscripción.

#### Scenario: Recibo recién emitido

- **WHEN** se emite un recibo
- **THEN** queda con el pago pendiente

#### Scenario: El aspirante ve el estado de su pago

- **WHEN** un aspirante consulta su recibo
- **THEN** ve si su pago figura como pendiente o como verificado

#### Scenario: Sin pago verificado no hay aprobación

- **WHEN** se intenta aprobar una inscripción cuyo recibo sigue con el pago pendiente
- **THEN** la aprobación se rechaza indicando que falta verificar el pago

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
