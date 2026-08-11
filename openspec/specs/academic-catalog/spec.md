# academic-catalog Specification

## Purpose
Define a qué se puede aspirar y cuándo, de modo que una inscripción no quede colgando de valores
escritos a mano y que abrir el semestre siguiente no exija tocar el código.
## Requirements
### Requirement: El sistema conoce los programas académicos ofertados

El sistema SHALL mantener la lista de programas a los que se puede aspirar, cada uno con un código
estable y un nombre presentable. Un programa SHALL poder marcarse como no ofertado sin borrarlo,
para no romper las inscripciones que ya lo eligieron.

#### Scenario: Se consultan los programas disponibles

- **WHEN** un aspirante llega al paso donde elige programa
- **THEN** ve los programas ofertados con su nombre, y no ve los que están fuera de oferta

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
