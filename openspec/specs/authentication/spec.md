# authentication Specification

## Purpose
Permite que quien tiene cuenta demuestre que es esa persona y mantenga esa identidad durante su
visita, de modo que el resto del sistema pueda saber a quién le está respondiendo sin volver a
preguntárselo en cada petición.
## Requirements
### Requirement: Una persona con cuenta puede iniciar sesión

El sistema SHALL permitir iniciar sesión con el correo y la contraseña de la cuenta. Un intento
fallido SHALL responder con un mensaje que **no permita distinguir** si el correo no existe, si
la contraseña es incorrecta, o si la cuenta fue eliminada.

El sistema SHALL emplear el mismo esfuerzo de cómputo tanto si la cuenta existe como si no, de
modo que el tiempo de respuesta tampoco revele si el correo está registrado.

#### Scenario: Credenciales correctas

- **WHEN** se ingresa con el correo y la contraseña de una cuenta existente
- **THEN** la sesión queda iniciada y el sistema reconoce a esa persona en las peticiones
  siguientes

#### Scenario: Contraseña incorrecta

- **WHEN** se ingresa un correo existente con una contraseña equivocada
- **THEN** no se inicia sesión y se responde con un mensaje neutro

#### Scenario: El correo no existe

- **WHEN** se ingresa un correo que no tiene cuenta
- **THEN** no se inicia sesión y se responde con **el mismo mensaje** que ante una contraseña
  incorrecta

#### Scenario: La cuenta fue eliminada

- **WHEN** se ingresa con las credenciales correctas de una cuenta eliminada de forma lógica
- **THEN** no se inicia sesión y se responde con el mismo mensaje neutro

#### Scenario: El administrador original puede entrar

- **WHEN** se ingresa con el correo y la contraseña de la cuenta de administrador creada por la
  inicialización del sistema
- **THEN** la sesión queda iniciada con rol ADMIN

### Requirement: La sesión no es accesible desde el navegador

La sesión SHALL sostenerse en un medio que el código JavaScript de la página **no pueda leer**.
El sistema SHALL NOT devolver la credencial de sesión en el cuerpo de ninguna respuesta.

#### Scenario: La credencial no es legible desde la página

- **WHEN** se inicia sesión y se inspecciona lo que el código de la página puede leer
- **THEN** la credencial de sesión no está entre lo accesible

#### Scenario: La respuesta de ingreso no lleva la credencial

- **WHEN** el ingreso termina con éxito
- **THEN** el cuerpo de la respuesta describe a la persona y su rol, pero no incluye la
  credencial de sesión

### Requirement: El sistema responde quién es la persona autenticada

El sistema SHALL ofrecer una forma de consultar la identidad de quien tiene la sesión abierta,
devolviendo al menos su documento, su correo y su rol. Es la **única fuente de verdad** sobre
el rol: nunca se toma de nada que envíe el cliente.

#### Scenario: Con sesión válida

- **WHEN** se consulta la identidad propia con una sesión activa
- **THEN** se devuelve el documento, el correo y el rol de esa cuenta

#### Scenario: Sin sesión

- **WHEN** se consulta la identidad propia sin haber iniciado sesión
- **THEN** se responde que no hay sesión, sin revelar ninguna información de ninguna cuenta

#### Scenario: Credencial manipulada

- **WHEN** se consulta la identidad propia presentando una credencial de sesión alterada o
  firmada por otro emisor
- **THEN** se responde que no hay sesión, y la credencial se descarta

#### Scenario: La cuenta se eliminó con la sesión abierta

- **WHEN** una cuenta se elimina de forma lógica mientras su sesión sigue vigente y esa sesión
  consulta su identidad
- **THEN** se responde que no hay sesión

### Requirement: La sesión se puede cerrar

El sistema SHALL permitir cerrar la sesión. Tras cerrarla, la credencial anterior SHALL dejar
de dar acceso.

#### Scenario: Cierre de sesión

- **WHEN** una persona con sesión activa cierra sesión
- **THEN** deja de estar autenticada y vuelve a la pantalla pública de ingreso

#### Scenario: La credencial anterior ya no sirve

- **WHEN** se intenta consultar la identidad propia después de haber cerrado sesión
- **THEN** se responde que no hay sesión

#### Scenario: Cerrar sesión sin tenerla

- **WHEN** se pide cerrar sesión sin haberla iniciado
- **THEN** la operación termina sin error y sin efecto

### Requirement: La sesión caduca sola

La sesión SHALL tener una duración limitada por configuración. Pasada esa duración SHALL dejar
de ser válida sin que nadie tenga que cerrarla, y SHALL NOT renovarse automáticamente.

#### Scenario: Sesión vencida

- **WHEN** se usa una sesión cuya duración ya expiró
- **THEN** se responde que no hay sesión, igual que si nunca se hubiera iniciado

#### Scenario: La duración es configurable

- **WHEN** se cambia la duración de sesión en la configuración y se reinicia el sistema
- **THEN** las sesiones nuevas caducan según el valor nuevo

