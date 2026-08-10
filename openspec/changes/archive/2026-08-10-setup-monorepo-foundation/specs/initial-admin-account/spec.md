## Purpose

Garantiza que una instalación recién creada tenga exactamente una cuenta con rol ADMIN, de
modo que exista desde el primer momento alguien capaz de administrar la plataforma, antes de
que exista cualquier flujo de registro o de inicio de sesión.

## ADDED Requirements

### Requirement: La instalación crea la cuenta de administrador original

La inicialización del sistema SHALL crear una cuenta con rol ADMIN a partir de la
configuración del entorno, tomando de allí su tipo y número de documento, su correo y su
contraseña. La contraseña SHALL almacenarse de forma irreversible y SHALL NOT quedar guardada
en texto plano en ningún lugar del sistema.

#### Scenario: Primera inicialización

- **WHEN** se inicializa una base de datos vacía con la configuración del administrador
  original presente
- **THEN** queda creada una cuenta con rol ADMIN, con el documento y el correo indicados en la
  configuración, y su contraseña almacenada de forma irreversible

#### Scenario: Falta la configuración del administrador

- **WHEN** se inicializa el sistema sin la configuración del administrador original
- **THEN** la inicialización falla con un mensaje que nombra la configuración faltante y no
  crea ninguna cuenta

#### Scenario: La contraseña no queda en texto plano

- **WHEN** se inspecciona la base de datos tras la inicialización
- **THEN** el registro de la cuenta de administrador no contiene la contraseña en texto plano

### Requirement: La inicialización es idempotente

Ejecutar la inicialización más de una vez SHALL dejar el sistema con exactamente una cuenta de
administrador original. La cuenta SHALL identificarse por su tipo y número de documento.

#### Scenario: Segunda ejecución sin cambios

- **WHEN** se ejecuta la inicialización una segunda vez con la misma configuración
- **THEN** el sistema sigue teniendo exactamente una cuenta de administrador original y no se
  crean registros duplicados

#### Scenario: Cambia el correo en la configuración

- **WHEN** se cambia el correo del administrador en la configuración y se vuelve a ejecutar la
  inicialización
- **THEN** la cuenta existente queda con el correo nuevo y sigue habiendo una sola cuenta de
  administrador original

#### Scenario: Cambia la contraseña en la configuración

- **WHEN** se cambia la contraseña del administrador en la configuración y se vuelve a
  ejecutar la inicialización
- **THEN** la cuenta existente queda con la contraseña nueva y la anterior deja de ser válida

#### Scenario: Cambia el documento en la configuración

- **WHEN** se cambia el documento del administrador en la configuración y se vuelve a ejecutar
  la inicialización sobre una base de datos que ya tiene la cuenta original
- **THEN** la inicialización falla con un mensaje que explica el conflicto y NO crea una
  segunda cuenta de administrador

### Requirement: La cuenta de administrador original es indestructible

La cuenta creada por la inicialización SHALL quedar marcada como cuenta de sistema. Ningún
flujo de la plataforma, presente o futuro, SHALL permitir eliminarla, desactivarla ni cambiar
su rol, sea cual sea el rol de quien lo intente.

#### Scenario: La cuenta queda marcada

- **WHEN** se consulta la cuenta de administrador original tras la inicialización
- **THEN** aparece marcada como cuenta de sistema, de forma distinguible de cualquier otra
  cuenta con rol ADMIN

#### Scenario: Intento de eliminarla

- **WHEN** un usuario con rol ADMIN intenta eliminar la cuenta de administrador original
- **THEN** la operación se rechaza con un error que explica que es una cuenta de sistema, y la
  cuenta permanece intacta

#### Scenario: Intento de cambiar su rol

- **WHEN** un usuario con rol ADMIN intenta cambiar el rol de la cuenta de administrador
  original a APPLICANT o a STUDENT
- **THEN** la operación se rechaza y el rol permanece como ADMIN

#### Scenario: Intento desde un rol no autorizado

- **WHEN** un usuario con rol APPLICANT o STUDENT, o alguien sin sesión, intenta eliminar o
  modificar la cuenta de administrador original
- **THEN** la operación se rechaza por falta de permisos, sin revelar si la cuenta existe
