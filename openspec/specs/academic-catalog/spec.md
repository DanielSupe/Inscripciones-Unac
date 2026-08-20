# academic-catalog Specification

## Purpose
Define a qué se puede aspirar y cuándo, de modo que una inscripción no quede colgando de valores
escritos a mano y que abrir el semestre siguiente no exija tocar el código.
## Requirements
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

### Requirement: El periodo académico delimita cuándo se puede inscribir

El sistema SHALL mantener periodos académicos identificados por un código legible, cada uno con
su fecha de apertura, su fecha de cierre y el valor del derecho de inscripción vigente. Fuera de
esa ventana SHALL NO poder iniciarse una inscripción nueva.

#### Scenario: El periodo está abierto

- **WHEN** un aspirante entra a inscribirse dentro de la ventana del periodo
- **THEN** puede iniciar su inscripción

#### Scenario: El periodo todavía no abre

- **WHEN** un aspirante entra antes de la fecha de apertura
- **THEN** no puede iniciar una inscripción, y se le indica desde cuándo podrá

#### Scenario: El periodo ya cerró

- **WHEN** un aspirante entra después de la fecha de cierre
- **THEN** no puede iniciar una inscripción, y se le indica que el periodo cerró

#### Scenario: Una inscripción empezada durante el cierre

- **WHEN** un aspirante empezó su inscripción con el periodo abierto e intenta enviarla después
  de la fecha de cierre
- **THEN** el envío se rechaza indicando que el periodo cerró, y lo diligenciado se conserva

#### Scenario: No hay ningún periodo abierto

- **WHEN** un aspirante entra y ningún periodo está abierto
- **THEN** se le indica con claridad que no hay inscripciones abiertas, en lugar de mostrarle un
  formulario que no va a poder enviar

### Requirement: El valor del derecho de inscripción vive en el periodo

El valor que debe pagar un aspirante SHALL tomarse del periodo al que se inscribe, y SHALL NOT
estar escrito en el código. Cambiar el valor SHALL afectar únicamente a las inscripciones que se
envíen después del cambio.

#### Scenario: Se consulta el valor vigente

- **WHEN** un aspirante llega al final de su inscripción
- **THEN** el valor que se le cobra es el que tiene configurado el periodo al que se inscribe

#### Scenario: El valor cambia después de emitir un recibo

- **WHEN** se cambia el valor del periodo y ya había recibos emitidos
- **THEN** los recibos ya emitidos conservan el valor con el que se emitieron

### Requirement: El administrador gestiona los periodos académicos

El sistema SHALL permitir al rol ADMIN crear periodos académicos y modificar sus fechas de
apertura y cierre, su tarifa y si están activos. Un periodo SHALL identificarse por un código
único, y SHALL poder desactivarse sin borrarse, para no romper las inscripciones que ya
pertenecen a él.

Esta gestión SHALL estar reservada al rol ADMIN.

#### Scenario: Se abre el periodo siguiente

- **WHEN** un administrador crea un periodo con su código, sus fechas y su tarifa
- **THEN** queda creado, y los aspirantes pueden inscribirse en él dentro de su ventana

#### Scenario: Se corrige la fecha de cierre

- **WHEN** un administrador amplía la fecha de cierre de un periodo abierto
- **THEN** las inscripciones que estaban a punto de quedarse fuera de plazo pueden enviarse

#### Scenario: Se repite un código

- **WHEN** un administrador intenta crear un periodo con un código que ya existe
- **THEN** la operación se rechaza y el periodo existente no se altera

#### Scenario: Las fechas tienen que tener sentido

- **WHEN** un administrador intenta guardar un periodo cuya fecha de cierre es anterior a la de
  apertura
- **THEN** la operación se rechaza explicando el problema

#### Scenario: Se desactiva un periodo

- **WHEN** un administrador desactiva un periodo
- **THEN** deja de admitir inscripciones nuevas, y las que ya pertenecen a él se conservan y se
  pueden seguir revisando

#### Scenario: Un rol no autorizado intenta gestionarlos

- **WHEN** una persona con rol APPLICANT o STUDENT, o alguien sin sesión, intenta crear o
  modificar un periodo
- **THEN** se rechaza por falta de permisos y ningún periodo cambia

### Requirement: Cambiar la tarifa no afecta a lo ya cobrado

Modificar la tarifa de un periodo SHALL afectar únicamente a los recibos que se emitan después
del cambio.

#### Scenario: Se sube la tarifa a mitad de periodo

- **WHEN** un administrador cambia la tarifa de un periodo en el que ya hay recibos emitidos
- **THEN** esos recibos conservan su valor original, y los que se emitan a partir de ese momento
  llevan el valor nuevo

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
