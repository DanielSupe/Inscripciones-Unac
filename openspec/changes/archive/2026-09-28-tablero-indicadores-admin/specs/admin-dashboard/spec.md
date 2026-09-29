## Purpose

Da al administrador, al entrar al panel, una lectura inmediata del estado de la admisión: cuánto se
lleva frente a la meta global de matriculados, cuántos aspirantes hay en cada etapa y cuántos pagos
faltan por verificar.

## ADDED Requirements

### Requirement: Consultar los indicadores del tablero

El sistema SHALL ofrecer a un ADMIN autenticado una consulta de indicadores que reúna, en una sola
respuesta, la meta global de matriculados, el embudo de inscripciones por estado y el estado de los
pagos. Los indicadores SHALL ser acumulados de todos los periodos y SHALL calcularse en el momento
de la consulta.

Ningún otro rol SHALL poder consultarlos.

#### Scenario: El ADMIN consulta los indicadores

- **WHEN** un ADMIN autenticado pide los indicadores
- **THEN** recibe la meta global, el embudo por estado y el conteo de pagos en una sola respuesta

#### Scenario: Un rol no autorizado pide los indicadores

- **WHEN** un APPLICANT, un STUDENT o un DEAN pide los indicadores
- **THEN** el sistema deniega la consulta por permiso insuficiente

#### Scenario: Sesión ausente o expirada

- **WHEN** alguien sin sesión válida pide los indicadores
- **THEN** el sistema responde que no está autenticado

### Requirement: Meta global de matriculados

La meta global SHALL ser la suma de las metas de las facultades activas que tienen meta. Los
matriculados que cuentan para el avance SHALL ser las inscripciones `APPROVED` de esas mismas
facultades, y el avance SHALL ser ese número como porcentaje de la meta global, redondeado al
entero más cercano y sin recortarse al 100 %.

El indicador SHALL incluir además el total de matriculados de todas las facultades activas, tengan
meta o no, y cuántas facultades activas no tienen meta.

Cuando ninguna facultad activa tiene meta, la meta global y el avance SHALL indicarse como no
definidos, no como cero.

#### Scenario: Todas las facultades tienen meta

- **WHEN** dos facultades activas tienen metas 100 y 50, y llevan 60 y 30 inscripciones aprobadas
- **THEN** la meta global es 150, cuentan 90 matriculados y el avance es del 60 %
- **AND** el total de matriculados es 90 y no hay facultades sin meta

#### Scenario: Una facultad sin meta no altera el avance

- **WHEN** una facultad activa tiene meta 100 y 40 aprobadas, y otra no tiene meta y lleva 25
- **THEN** la meta global es 100, cuentan 40 matriculados y el avance es del 40 %
- **AND** el total de matriculados es 65 y se informa una facultad sin meta

#### Scenario: Ninguna facultad tiene meta

- **WHEN** ninguna facultad activa tiene meta y hay 12 inscripciones aprobadas
- **THEN** la meta global y el avance figuran como no definidos
- **AND** el total de matriculados es 12

#### Scenario: Se superó la meta global

- **WHEN** la meta global es 80 y cuentan 100 matriculados
- **THEN** el avance es del 125 %

#### Scenario: Las facultades inactivas no cuentan

- **WHEN** una facultad inactiva tiene meta e inscripciones aprobadas
- **THEN** ni su meta ni sus matriculados entran en ningún número del indicador

### Requirement: Embudo de inscripciones por estado

El embudo SHALL informar, para cada estado posible de una inscripción, cuántas inscripciones hay en
él. Los estados sin inscripciones SHALL aparecer con cero en vez de omitirse, para que el embudo
tenga siempre la misma forma.

#### Scenario: Conteo por estado

- **WHEN** hay 5 inscripciones en borrador, 3 enviadas y 2 aprobadas
- **THEN** el embudo informa 5, 3 y 2 en esos estados y cero en todos los demás

#### Scenario: No hay inscripciones

- **WHEN** no existe ninguna inscripción
- **THEN** el embudo informa cero en cada uno de los estados

### Requirement: Estado de los pagos

El indicador de pagos SHALL informar cuántos recibos emitidos están pendientes de verificación y
cuántos están verificados. Una inscripción sin recibo emitido SHALL quedar fuera de ambos números.

#### Scenario: Recibos pendientes y verificados

- **WHEN** hay 7 recibos pendientes y 4 verificados, y 3 borradores sin recibo
- **THEN** el indicador informa 7 pendientes y 4 verificados

### Requirement: Tablero en el inicio del panel de administración

La pantalla de inicio del panel de administración SHALL mostrar los tres indicadores. Cada número
SHALL estar escrito como texto, no transmitido solo por color o por una barra. El bloque de meta
global SHALL enlazar a la pestaña de metas y SHALL aclarar que las cifras son acumuladas.

La pantalla SHALL seguir siendo inalcanzable para quien no sea ADMIN, resolviendo la autorización
al entrar en la ruta.

#### Scenario: El ADMIN entra al panel

- **WHEN** un ADMIN autenticado abre el inicio del panel
- **THEN** ve la meta global con su avance, el embudo por estado y el conteo de pagos

#### Scenario: Facultades fuera del cálculo

- **WHEN** alguna facultad activa no tiene meta
- **THEN** el bloque de meta global dice cuántas facultades no cuentan para el avance

#### Scenario: Error al cargar los indicadores

- **WHEN** la consulta de indicadores falla
- **THEN** la pantalla anuncia el error de forma accesible en lugar de mostrar ceros

#### Scenario: Un rol no autorizado intenta abrir el panel

- **WHEN** un APPLICANT, un STUDENT o un DEAN navega al inicio del panel de administración
- **THEN** la aplicación lo redirige fuera de la zona de administración sin pedir los indicadores
