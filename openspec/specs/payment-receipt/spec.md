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

