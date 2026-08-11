## ADDED Requirements

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
