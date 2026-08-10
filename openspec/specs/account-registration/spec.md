# account-registration Specification

## Purpose
Permite que una persona sin relación previa con la universidad se cree una cuenta de aspirante
por su cuenta, dejando constancia de qué políticas de tratamiento de datos aceptó, y sin que el
proceso pueda usarse para averiguar quién más está registrado.
## Requirements
### Requirement: Cualquier persona puede crear una cuenta de aspirante

El sistema SHALL permitir crear una cuenta indicando tipo y número de documento, correo con su
confirmación, contraseña y la aceptación de las políticas de tratamiento de datos. La cuenta
creada SHALL quedar con rol APPLICANT y SHALL poder iniciar sesión inmediatamente después.

El registro SHALL estar disponible sin haber iniciado sesión.

#### Scenario: Registro con datos válidos

- **WHEN** una persona envía el formulario con un documento y un correo que nadie ha usado, las
  dos copias del correo coincidiendo, una contraseña aceptable y las políticas aceptadas
- **THEN** queda creada una cuenta con rol APPLICANT, y se le indica que ya puede iniciar
  sesión

#### Scenario: Las dos copias del correo no coinciden

- **WHEN** el correo y su confirmación son distintos
- **THEN** no se crea ninguna cuenta y se señala el campo de confirmación

#### Scenario: No se aceptan las políticas

- **WHEN** se envía el formulario sin marcar la aceptación de políticas
- **THEN** no se crea ninguna cuenta y se indica que la aceptación es obligatoria

#### Scenario: La contraseña es demasiado débil

- **WHEN** se envía una contraseña más corta que el mínimo exigido
- **THEN** no se crea ninguna cuenta y se indica el mínimo requerido

#### Scenario: Datos con formato inválido

- **WHEN** el número de documento contiene caracteres no admitidos, o el correo no tiene forma
  de correo, o el tipo de documento no es uno de los aceptados
- **THEN** no se crea ninguna cuenta y se señala cada campo con problema

#### Scenario: Una persona con sesión iniciada abre el registro

- **WHEN** alguien que ya tiene sesión activa entra al registro
- **THEN** se le lleva a la pantalla que corresponde a su rol, en lugar de ofrecerle crear otra
  cuenta

### Requirement: La identidad es única y los errores no revelan quién existe

El documento y el correo SHALL identificar de forma única a una persona. Cuando el registro se
rechaza porque alguno ya está en uso, el sistema SHALL responder con un mensaje que **no
permita distinguir** cuál de los dos causó el rechazo, ni confirmar que esa persona tiene
cuenta.

La unicidad SHALL estar garantizada aunque dos registros con los mismos datos lleguen a la vez.

#### Scenario: El documento ya está registrado

- **WHEN** se intenta registrar un documento que ya tiene cuenta
- **THEN** no se crea ninguna cuenta y se responde con un mensaje neutro que no confirma que
  ese documento exista

#### Scenario: El correo ya está registrado

- **WHEN** se intenta registrar un correo que ya tiene cuenta
- **THEN** no se crea ninguna cuenta y se responde con **el mismo mensaje** que en el caso
  anterior

#### Scenario: El documento pertenece a una cuenta eliminada

- **WHEN** se intenta registrar un documento que pertenece a una cuenta eliminada de forma
  lógica
- **THEN** no se crea una cuenta nueva y se responde con el mismo mensaje neutro, sin revelar
  que la cuenta existió

#### Scenario: Dos registros simultáneos con el mismo documento

- **WHEN** dos peticiones con el mismo documento llegan a la vez
- **THEN** solo una de ellas crea la cuenta, y la otra recibe el mensaje neutro

### Requirement: Queda evidencia de qué políticas se aceptaron

Al crear la cuenta, el sistema SHALL registrar la versión vigente de las políticas de
tratamiento de datos y el momento exacto de la aceptación. El texto de las políticas SHALL
poder consultarse sin haber iniciado sesión, desde el propio formulario de registro.

#### Scenario: Se guarda la evidencia

- **WHEN** se crea una cuenta aceptando las políticas
- **THEN** la cuenta queda con la versión de políticas vigente en ese momento y con la marca de
  tiempo de la aceptación

#### Scenario: Las políticas se pueden leer antes de aceptar

- **WHEN** una persona sin sesión abre el texto de las políticas desde el formulario
- **THEN** puede leerlo completo y volver al formulario sin perder lo que ya había escrito

#### Scenario: Cambia la versión de las políticas

- **WHEN** se publica una versión nueva de las políticas y después alguien se registra
- **THEN** la cuenta nueva queda asociada a la versión nueva, y las cuentas anteriores
  conservan la versión que aceptaron en su momento

### Requirement: El registro nunca otorga privilegios

El registro SHALL crear siempre cuentas con rol APPLICANT. El sistema SHALL ignorar cualquier
intento de fijar el rol, la marca de cuenta de sistema o cualquier otro atributo de privilegio
desde la petición de registro.

#### Scenario: La petición intenta fijar un rol

- **WHEN** una petición de registro incluye un rol distinto de APPLICANT
- **THEN** la cuenta se crea igualmente con rol APPLICANT, y el valor enviado se ignora sin
  producir un error que confirme que ese campo existe

#### Scenario: La petición intenta marcarse como cuenta de sistema

- **WHEN** una petición de registro intenta marcar la cuenta como cuenta de sistema
- **THEN** la cuenta se crea sin esa marca

### Requirement: La contraseña nunca queda expuesta

La contraseña SHALL almacenarse de forma irreversible, SHALL NOT aparecer en texto plano en la
base de datos ni en los registros del sistema, y SHALL NOT devolverse en ninguna respuesta.

#### Scenario: La contraseña no se almacena en claro

- **WHEN** se inspecciona la cuenta recién creada en la base de datos
- **THEN** no aparece la contraseña en texto plano

#### Scenario: La respuesta del registro no devuelve la contraseña

- **WHEN** el registro termina con éxito
- **THEN** la respuesta no contiene la contraseña ni su forma almacenada

