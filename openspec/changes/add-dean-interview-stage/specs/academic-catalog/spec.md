## MODIFIED Requirements

### Requirement: El sistema conoce los programas académicos ofertados

El sistema SHALL mantener la lista de programas a los que se puede aspirar, cada uno con un código
estable, un nombre presentable y **la facultad a la que pertenece**. Un programa SHALL pertenecer
siempre a exactamente una facultad: es ese vínculo el que decide qué decano recibirá cada
inscripción, así que un programa sin facultad no podría llegar a nadie.

Un programa SHALL poder marcarse como no ofertado sin borrarlo, para no romper las inscripciones
que ya lo eligieron.

#### Scenario: Se consultan los programas disponibles

- **WHEN** un aspirante llega al paso donde elige programa
- **THEN** ve los programas ofertados con su nombre, y no ve los que están fuera de oferta

#### Scenario: Cada programa cuelga de una facultad

- **WHEN** se consulta un programa del catálogo
- **THEN** se conoce a qué facultad pertenece

#### Scenario: Un programa sale de oferta

- **WHEN** un programa deja de ofertarse
- **THEN** no aparece para elegir en inscripciones nuevas, y las inscripciones existentes que lo
  eligieron lo siguen mostrando con normalidad

#### Scenario: Se intenta aspirar a un programa fuera de oferta

- **WHEN** se envía una inscripción indicando un programa que no está ofertado
- **THEN** la operación se rechaza indicando que ese programa no está disponible

## ADDED Requirements

### Requirement: El sistema conoce las facultades y quién las dirige

El sistema SHALL mantener la lista de facultades, cada una con un código estable, un nombre
presentable y, como máximo, **un decano**. Una persona con rol DEAN SHALL dirigir como máximo una
facultad.

La facultad SHALL poder existir sin decano asignado. Es un estado válido pero incómodo, y el
sistema SHALL poder señalarlo, porque ninguna inscripción de sus programas podrá avanzar mientras
dure.

Las facultades SHALL NOT borrarse: de ellas cuelgan programas, y de los programas, inscripciones.

#### Scenario: Se consulta la facultad de un programa

- **WHEN** se necesita saber a quién corresponde decidir sobre una inscripción
- **THEN** se obtiene la facultad del programa elegido y el decano que la dirige

#### Scenario: Una facultad sin decano

- **WHEN** se consulta una facultad cuyo decano fue eliminado o nunca se asignó
- **THEN** consta como facultad sin decano, y las inscripciones de sus programas no pueden
  entregarse

#### Scenario: Un decano dirige una sola facultad

- **WHEN** se intenta poner a una persona al frente de una segunda facultad
- **THEN** la operación se rechaza

### Requirement: Las facultades y sus decanos se crean al iniciar el sistema

La inicialización SHALL crear las facultades, asignar cada programa sembrado a la suya y crear la
cuenta de decano de cada una con rol DEAN. Las credenciales iniciales de esas cuentas SHALL
tomarse de la configuración del entorno, nunca del código.

La inicialización SHALL ser **idempotente**: ejecutarla de nuevo SHALL NOT duplicar facultades,
programas ni decanos, ni sobrescribir una contraseña que alguien ya haya cambiado.

#### Scenario: Primera inicialización

- **WHEN** se inicializa un sistema vacío
- **THEN** quedan creadas las facultades, cada programa pertenece a una, y cada facultad tiene su
  decano con rol DEAN

#### Scenario: Se vuelve a inicializar

- **WHEN** se inicializa un sistema que ya lo estaba
- **THEN** no se duplica nada y las contraseñas vigentes se conservan

#### Scenario: Falta la configuración de los decanos

- **WHEN** se intenta inicializar sin las credenciales de decano en la configuración
- **THEN** la inicialización falla ruidosamente, en lugar de crear cuentas con una contraseña
  adivinable

#### Scenario: El decano entra con lo sembrado

- **WHEN** un decano recién sembrado inicia sesión con sus credenciales
- **THEN** la sesión queda iniciada con rol DEAN y llega a la zona de su facultad
