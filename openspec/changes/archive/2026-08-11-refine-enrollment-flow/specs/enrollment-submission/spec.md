## MODIFIED Requirements

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
