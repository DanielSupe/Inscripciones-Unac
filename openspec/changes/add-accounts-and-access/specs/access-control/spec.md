## Purpose

Decide qué puede hacer cada rol, negando por defecto, de modo que una operación quede protegida
por haberlo declarado explícitamente y no por el descuido de nadie en no enlazarla desde la
interfaz.

## ADDED Requirements

### Requirement: Toda operación protegida declara qué roles la pueden usar

Cada operación del sistema SHALL declarar explícitamente si es pública y, si no lo es, qué
roles pueden ejecutarla. Una operación que no lo declare SHALL comportarse como denegada.

#### Scenario: Rol autorizado

- **WHEN** una persona con un rol autorizado ejecuta la operación
- **THEN** la operación se realiza con normalidad

#### Scenario: Sin sesión

- **WHEN** alguien sin sesión intenta una operación protegida
- **THEN** se rechaza indicando que hace falta iniciar sesión, y la operación no produce ningún
  efecto

#### Scenario: Rol insuficiente

- **WHEN** una persona con rol APPLICANT o STUDENT intenta una operación reservada a ADMIN
- **THEN** se rechaza por falta de permisos y la operación no produce ningún efecto

#### Scenario: El rechazo no revela si el recurso existe

- **WHEN** una persona sin permiso intenta una operación sobre un recurso concreto
- **THEN** la respuesta es la misma tanto si ese recurso existe como si no

#### Scenario: Operación pública

- **WHEN** alguien sin sesión consulta el estado del sistema, abre el registro o lee las
  políticas
- **THEN** la operación se atiende con normalidad, por estar declarada como pública

### Requirement: El rol se toma siempre de la sesión del servidor

El sistema SHALL determinar el rol de quien pide algo exclusivamente a partir de su sesión.
SHALL NOT aceptar el rol, el identificador de usuario ni ninguna otra marca de privilegio desde
el cuerpo, los parámetros o las cabeceras de la petición.

#### Scenario: La petición declara su propio rol

- **WHEN** una persona con rol APPLICANT envía en su petición un campo que dice que es ADMIN
- **THEN** el sistema la trata como APPLICANT y el campo enviado se ignora

#### Scenario: La petición suplanta a otra persona

- **WHEN** una petición incluye el identificador de otra cuenta con la intención de actuar en
  su nombre
- **THEN** la operación se resuelve sobre la cuenta de la sesión, no sobre la indicada

### Requirement: Cada rol tiene su propia zona en la aplicación

El frontend SHALL llevar a cada persona a la zona que corresponde a su rol tras iniciar sesión,
y SHALL resolver la autorización de una ruta **antes de mostrar su contenido**.

#### Scenario: Cada rol aterriza en su zona

- **WHEN** una persona inicia sesión
- **THEN** se le lleva a la zona de su rol: la de aspirante, la de estudiante o la de
  administración

#### Scenario: Ruta protegida sin sesión

- **WHEN** alguien sin sesión abre directamente la dirección de una zona protegida
- **THEN** se le lleva a la pantalla de ingreso sin que llegue a verse el contenido protegido

#### Scenario: Ruta de otro rol

- **WHEN** una persona con rol APPLICANT abre directamente la dirección de la zona de
  administración
- **THEN** se le niega el acceso sin mostrar el contenido, y se le devuelve a su propia zona

#### Scenario: Ocultar el enlace no es la protección

- **WHEN** se ejecuta directamente contra el API una operación cuyo botón no aparece en la
  interfaz de ese rol
- **THEN** el API la rechaza igualmente por falta de permisos

### Requirement: Una sesión caducada se comunica de forma comprensible

Cuando una operación se rechace porque la sesión dejó de ser válida, el frontend SHALL llevar a
la persona a la pantalla de ingreso explicando que su sesión caducó, y SHALL descartar los
datos que se hubieran mostrado durante esa sesión.

#### Scenario: La sesión caduca a mitad de navegación

- **WHEN** la sesión caduca y la persona realiza una acción cualquiera dentro de la aplicación
- **THEN** se le lleva a la pantalla de ingreso con un mensaje que explica que la sesión
  caducó, en lugar de mostrar un error genérico

#### Scenario: No quedan datos de la sesión anterior

- **WHEN** una sesión caduca y a continuación inicia sesión otra persona en el mismo navegador
- **THEN** no se muestra en ningún momento información de la sesión anterior

#### Scenario: Un error de permisos no se confunde con una sesión caducada

- **WHEN** una persona con sesión válida intenta algo para lo que su rol no alcanza
- **THEN** se le indica que no tiene permiso y **no** se le expulsa a la pantalla de ingreso
