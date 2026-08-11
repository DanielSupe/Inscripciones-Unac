## Purpose

Le da al administrador el control de las cuentas de la plataforma —crearlas, corregirlas,
retirarlas y desbloquear a quien perdió su contraseña— sin que ese poder alcance a saltarse las
reglas que protegen la cuenta de sistema ni a repartir un rol que solo se gana.

## ADDED Requirements

### Requirement: El administrador consulta las cuentas de la plataforma

El sistema SHALL ofrecer al rol ADMIN un listado de cuentas paginado, con búsqueda por documento,
correo o nombre, y filtro por rol. Las cuentas eliminadas SHALL NOT aparecer salvo que se pidan
explícitamente.

Este listado SHALL estar reservado al rol ADMIN.

#### Scenario: Listado paginado

- **WHEN** un administrador abre el listado de cuentas
- **THEN** ve una página de resultados, cuántas cuentas hay en total, y puede avanzar a las
  siguientes

#### Scenario: Búsqueda

- **WHEN** un administrador busca por un número de documento, un correo o un nombre
- **THEN** solo ve las cuentas que coinciden

#### Scenario: Filtro por rol

- **WHEN** un administrador filtra por un rol
- **THEN** solo ve las cuentas que lo tienen

#### Scenario: Las cuentas eliminadas quedan fuera

- **WHEN** un administrador abre el listado sin pedir las eliminadas
- **THEN** no aparece ninguna cuenta eliminada

#### Scenario: Un rol no autorizado intenta consultarlo

- **WHEN** una persona con rol APPLICANT o STUDENT, o alguien sin sesión, intenta abrir el
  listado de cuentas
- **THEN** se rechaza por falta de permisos, sin devolver ninguna cuenta

### Requirement: El administrador crea cuentas, pero no reparte el rol de estudiante

El sistema SHALL permitir al rol ADMIN crear cuentas con rol APPLICANT o ADMIN, indicando
documento, correo y una contraseña inicial. SHALL rechazar la creación de una cuenta con rol
STUDENT: a ese rol solo se llega aprobando una inscripción.

Las reglas de unicidad de documento y correo SHALL ser las mismas que en el registro público.

#### Scenario: Se crea un aspirante

- **WHEN** un administrador crea una cuenta con rol APPLICANT
- **THEN** la cuenta queda creada y puede iniciar sesión con la contraseña indicada

#### Scenario: Se crea otro administrador

- **WHEN** un administrador crea una cuenta con rol ADMIN
- **THEN** la cuenta queda creada con ese rol, y no queda marcada como cuenta de sistema

#### Scenario: Se intenta crear un estudiante

- **WHEN** un administrador intenta crear una cuenta con rol STUDENT
- **THEN** la operación se rechaza explicando que a ese rol solo se llega aprobando una
  inscripción

#### Scenario: El documento o el correo ya están en uso

- **WHEN** un administrador intenta crear una cuenta con un documento o un correo que ya existe
- **THEN** la operación se rechaza indicando cuál de los dos está en uso

### Requirement: El administrador corrige los datos de una cuenta

El sistema SHALL permitir al rol ADMIN modificar el documento, el correo y el rol de una cuenta,
respetando la unicidad y la prohibición de asignar el rol STUDENT.

#### Scenario: Se corrige un correo

- **WHEN** un administrador cambia el correo de una cuenta por uno libre
- **THEN** la cuenta queda con el correo nuevo y su titular ingresa con él

#### Scenario: Se intenta usar un correo ajeno

- **WHEN** un administrador cambia el correo de una cuenta por uno que ya tiene otra
- **THEN** la operación se rechaza y el correo anterior se conserva

#### Scenario: Se intenta ascender a estudiante

- **WHEN** un administrador intenta cambiar el rol de una cuenta a STUDENT
- **THEN** la operación se rechaza y el rol anterior se conserva

### Requirement: Las cuentas se retiran sin borrarse

El sistema SHALL eliminar las cuentas de forma lógica. Una cuenta eliminada SHALL NOT poder
iniciar sesión, y sus inscripciones y recibos SHALL conservarse.

#### Scenario: Se elimina una cuenta

- **WHEN** un administrador elimina una cuenta
- **THEN** deja de aparecer en el listado y su titular ya no puede iniciar sesión

#### Scenario: Lo que dejó se conserva

- **WHEN** se elimina una cuenta que tenía una inscripción con recibo emitido
- **THEN** la inscripción y el recibo siguen existiendo

#### Scenario: Nadie se elimina a sí mismo

- **WHEN** un administrador intenta eliminar su propia cuenta
- **THEN** la operación se rechaza explicando por qué, y la cuenta permanece

#### Scenario: Nadie se degrada a sí mismo

- **WHEN** un administrador intenta cambiar su propio rol a uno sin permisos de administración
- **THEN** la operación se rechaza y el rol permanece

### Requirement: El administrador desbloquea a quien perdió su contraseña

El sistema SHALL permitir al rol ADMIN fijar una contraseña nueva para cualquier cuenta. La
contraseña anterior SHALL dejar de servir, y la nueva SHALL almacenarse de forma irreversible.

#### Scenario: Se restablece una contraseña

- **WHEN** un administrador fija una contraseña nueva para una cuenta
- **THEN** su titular ingresa con la nueva y la anterior deja de funcionar

#### Scenario: La contraseña nueva cumple las mismas reglas

- **WHEN** un administrador intenta fijar una contraseña más corta que el mínimo exigido
- **THEN** la operación se rechaza indicando el mínimo

#### Scenario: La contraseña no queda expuesta

- **WHEN** se restablece una contraseña
- **THEN** no queda almacenada en texto plano ni aparece en la respuesta

#### Scenario: Un rol no autorizado intenta restablecerla

- **WHEN** una persona con rol APPLICANT o STUDENT intenta restablecer la contraseña de una
  cuenta
- **THEN** se rechaza por falta de permisos y la contraseña no cambia

### Requirement: La cuenta de sistema resiste todas las operaciones de gestión

Ninguna operación de este listado SHALL poder eliminar la cuenta de administrador original,
cambiar su rol ni dejarla sin acceso, sea cual sea el rol de quien lo intente.

#### Scenario: Se intenta eliminar la cuenta de sistema

- **WHEN** un administrador intenta eliminar la cuenta de administrador original desde el
  listado de cuentas
- **THEN** la operación se rechaza explicando que es una cuenta de sistema, y la cuenta
  permanece intacta

#### Scenario: Se intenta degradar la cuenta de sistema

- **WHEN** un administrador intenta cambiar el rol de la cuenta de administrador original
- **THEN** la operación se rechaza y su rol sigue siendo ADMIN

#### Scenario: Su contraseña sí se puede restablecer

- **WHEN** un administrador restablece la contraseña de la cuenta de sistema
- **THEN** la operación se permite, porque protegerla de un olvido de contraseña la dejaría
  inservible en vez de protegida
