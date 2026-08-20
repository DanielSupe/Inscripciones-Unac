## MODIFIED Requirements

### Requirement: Cada rol tiene su propia zona en la aplicación

El frontend SHALL llevar a cada persona a la zona que corresponde a su rol tras iniciar sesión,
y SHALL resolver la autorización de una ruta **antes de mostrar su contenido**.

Los roles con zona propia SHALL ser APPLICANT, STUDENT, ADMIN y DEAN.

#### Scenario: Cada rol aterriza en su zona

- **WHEN** una persona inicia sesión
- **THEN** se le lleva a la zona de su rol: la de aspirante, la de estudiante, la de
  administración o la de la facultad

#### Scenario: Ruta protegida sin sesión

- **WHEN** alguien sin sesión abre directamente la dirección de una zona protegida
- **THEN** se le lleva a la pantalla de ingreso sin que llegue a verse el contenido protegido

#### Scenario: Ruta de otro rol

- **WHEN** una persona con rol APPLICANT abre directamente la dirección de la zona de
  administración
- **THEN** se le niega el acceso sin mostrar el contenido, y se le devuelve a su propia zona

#### Scenario: El decano no entra a la administración

- **WHEN** una persona con rol DEAN abre directamente la dirección de la zona de administración
- **THEN** se le niega el acceso y se le devuelve a la zona de su facultad

#### Scenario: El administrador no entra a la zona del decano

- **WHEN** una persona con rol ADMIN abre directamente la dirección de la zona de la facultad
- **THEN** se le niega el acceso y se le devuelve a la suya, donde ya puede consultar el proceso
  completo en solo lectura

#### Scenario: Ocultar el enlace no es la protección

- **WHEN** se ejecuta directamente contra el API una operación cuyo botón no aparece en la
  interfaz de ese rol
- **THEN** el API la rechaza igualmente por falta de permisos

## ADDED Requirements

### Requirement: El alcance del decano es su facultad, y lo fija el servidor

Toda operación del rol DEAN sobre una inscripción SHALL limitarse a las inscripciones cuyo
programa pertenezca a la facultad que esa persona dirige. La facultad SHALL deducirse de la
**sesión del servidor**, nunca de un dato que envíe el cliente.

Ante una inscripción de otra facultad, la respuesta SHALL ser indistinguible de la que se daría
si esa inscripción no existiera. Que exista, y de qué facultad es, no SHALL poder deducirse
comparando respuestas.

Un DEAN SHALL NOT tener ninguna de las atribuciones del ADMIN: no gestiona cuentas, ni periodos
académicos, ni verifica pagos.

#### Scenario: La facultad sale de la sesión

- **WHEN** un decano realiza cualquier operación sobre inscripciones
- **THEN** el alcance se calcula con la facultad de su cuenta, y cualquier facultad indicada en
  la petición se ignora

#### Scenario: Una inscripción ajena es indistinguible de una inexistente

- **WHEN** un decano pide una inscripción de otra facultad y otra que no existe
- **THEN** ambas respuestas son iguales, en código y en contenido

#### Scenario: El decano no gestiona cuentas

- **WHEN** una persona con rol DEAN intenta listar, crear, editar o eliminar cuentas
- **THEN** se rechaza por falta de permisos

#### Scenario: El decano no verifica pagos

- **WHEN** una persona con rol DEAN intenta marcar un pago como verificado
- **THEN** se rechaza por falta de permisos, y el recibo no cambia

#### Scenario: El decano no administra periodos

- **WHEN** una persona con rol DEAN intenta crear o editar un periodo académico
- **THEN** se rechaza por falta de permisos

#### Scenario: Un decano sin facultad

- **WHEN** una cuenta con rol DEAN que no dirige ninguna facultad intenta abrir su bandeja
- **THEN** no obtiene ninguna inscripción, y se le indica que no tiene facultad asignada
