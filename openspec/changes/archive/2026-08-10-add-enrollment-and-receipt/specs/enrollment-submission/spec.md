## Purpose

Permite que un aspirante diligencie su inscripción a lo largo de varias sesiones, la envíe cuando
esté completa, siga su avance y la corrija si se la rechazan, sin que nadie más pueda ver ni
tocar lo suyo.

## ADDED Requirements

### Requirement: La inscripción se diligencia por pasos y se guarda en cada uno

El sistema SHALL permitir avanzar por la inscripción en pasos, guardando lo diligenciado en cada
uno sin exigir que los siguientes estén completos. Una inscripción a medias SHALL poder retomarse
más tarde con todo lo escrito intacto.

#### Scenario: Se guarda un paso y se abandona

- **WHEN** un aspirante completa el primer paso, lo guarda y cierra el navegador
- **THEN** al volver a entrar encuentra su inscripción donde la dejó, con los datos que había
  escrito

#### Scenario: Un paso incompleto no bloquea el guardado

- **WHEN** un aspirante guarda un paso habiendo dejado campos por llenar
- **THEN** lo escrito se conserva y se le indica qué falta, sin perder nada

#### Scenario: Un dato con formato inválido no se guarda

- **WHEN** un aspirante escribe un año de graduación imposible o un teléfono con letras
- **THEN** se le señala el campo y ese valor no queda guardado

#### Scenario: Se retoma desde el paso pendiente

- **WHEN** un aspirante con una inscripción a medias vuelve a entrar
- **THEN** se le lleva al primer paso que le falta por completar

### Requirement: Cada aspirante tiene una inscripción por periodo

El sistema SHALL permitir a un aspirante una única inscripción por periodo académico. Iniciar una
inscripción cuando ya existe una para ese periodo SHALL devolver la existente en lugar de crear
otra.

#### Scenario: Se intenta iniciar dos veces en el mismo periodo

- **WHEN** un aspirante que ya tiene una inscripción en el periodo abierto intenta iniciar otra
- **THEN** se le lleva a la que ya tenía, sin crear una segunda

#### Scenario: Un periodo distinto admite una inscripción nueva

- **WHEN** un aspirante rechazado en un periodo se inscribe en el siguiente
- **THEN** puede crear una inscripción nueva, y la anterior se conserva tal como quedó

### Requirement: La inscripción se envía solo cuando está completa

El sistema SHALL rechazar el envío de una inscripción a la que le falten datos obligatorios o
documentos exigidos, indicando qué falta. Al enviarse con éxito SHALL quedar fuera del alcance de
edición del aspirante.

#### Scenario: Envío con todo completo

- **WHEN** un aspirante envía su inscripción con todos los datos y documentos
- **THEN** la inscripción queda enviada y se le confirma, indicándole que ahora será revisada

#### Scenario: Envío con datos faltantes

- **WHEN** un aspirante intenta enviar una inscripción a la que le faltan datos obligatorios
- **THEN** el envío se rechaza señalando qué falta, y la inscripción sigue siendo editable

#### Scenario: Envío con documentos faltantes

- **WHEN** un aspirante intenta enviar una inscripción sin alguno de los documentos exigidos
- **THEN** el envío se rechaza indicando qué documento falta

#### Scenario: Edición después de enviar

- **WHEN** un aspirante intenta modificar su inscripción ya enviada
- **THEN** la modificación se rechaza y los datos permanecen como se enviaron

#### Scenario: Envío por segunda vez

- **WHEN** un aspirante intenta enviar una inscripción que ya está enviada
- **THEN** la operación se rechaza sin alterar nada ni emitir un recibo nuevo

### Requirement: El avance de la inscripción sigue un camino definido

El sistema SHALL permitir únicamente las transiciones previstas del proceso, y SHALL rechazar
cualquier otra. El estado SHALL NOT poder fijarse directamente desde una petición.

El camino previsto es: diligenciando → enviada → en revisión → aprobada o rechazada, y desde
rechazada de vuelta a diligenciando para corregir.

#### Scenario: Transición no prevista

- **WHEN** se intenta llevar una inscripción de diligenciando a aprobada sin pasar por revisión
- **THEN** la operación se rechaza y el estado no cambia

#### Scenario: El estado no es un campo escribible

- **WHEN** una petición de guardado incluye el estado de la inscripción entre sus datos
- **THEN** el estado enviado se ignora y la inscripción conserva el suyo

#### Scenario: Aprobar exige que el pago esté verificado

- **WHEN** se intenta aprobar una inscripción cuyo recibo todavía no consta como pagado
- **THEN** la aprobación se rechaza indicando que falta verificar el pago

### Requirement: El aspirante consulta el avance de su proceso

El sistema SHALL mostrar al aspirante en qué punto está su inscripción y qué se espera de él a
continuación. Si fue rechazada SHALL mostrarle el motivo escrito por quien la revisó.

#### Scenario: Inscripción en revisión

- **WHEN** un aspirante consulta su proceso tras enviar
- **THEN** ve que está en revisión y que no tiene nada que hacer por ahora

#### Scenario: Inscripción rechazada

- **WHEN** un aspirante consulta su proceso después de que le rechazaran la inscripción
- **THEN** ve que fue rechazada y lee el motivo, junto con la indicación de que puede corregir y
  reenviar

#### Scenario: Inscripción aprobada

- **WHEN** un aspirante consulta su proceso después de que le aprobaran la inscripción
- **THEN** ve que fue aprobada

### Requirement: Una inscripción rechazada se corrige y se reenvía

El sistema SHALL permitir al aspirante volver a editar una inscripción rechazada y enviarla de
nuevo. Al reenviarla, el motivo del rechazo anterior SHALL dejar de mostrarse como vigente.

#### Scenario: Se corrige y se reenvía

- **WHEN** un aspirante con una inscripción rechazada corrige lo señalado y la envía otra vez
- **THEN** la inscripción vuelve a quedar enviada, a la espera de revisión

#### Scenario: No se emite un recibo nuevo al reenviar

- **WHEN** un aspirante reenvía una inscripción que ya tenía recibo emitido
- **THEN** conserva el recibo original y no se emite otro

#### Scenario: Una inscripción aprobada no se reabre

- **WHEN** un aspirante intenta volver a editar una inscripción ya aprobada
- **THEN** la operación se rechaza y la inscripción permanece aprobada

### Requirement: Cada quien ve únicamente su propia inscripción

El sistema SHALL resolver toda operación sobre una inscripción contra la persona de la sesión.
Un aspirante SHALL NOT poder consultar, modificar ni enviar la inscripción de otro, ni siquiera
indicando su identificador directamente.

#### Scenario: Se pide la inscripción de otro

- **WHEN** un aspirante pide una inscripción que no es suya usando su identificador
- **THEN** la respuesta es la misma que si esa inscripción no existiera

#### Scenario: Se modifica la inscripción de otro

- **WHEN** un aspirante intenta guardar datos en la inscripción de otro
- **THEN** la operación se rechaza y la inscripción ajena queda intacta

#### Scenario: Un estudiante consulta la suya

- **WHEN** una persona con rol STUDENT consulta la inscripción que le aprobaron
- **THEN** puede verla en solo lectura, sin poder modificarla

#### Scenario: Alguien sin sesión pide una inscripción

- **WHEN** se pide una inscripción sin haber iniciado sesión
- **THEN** se rechaza por falta de sesión, sin revelar si esa inscripción existe
