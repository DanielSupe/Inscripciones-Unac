# enrollment-goals Specification

## Purpose
Permite a la administración fijar cuántos matriculados espera de cada facultad y ver, en un solo
lugar, cuántos lleva realmente cada una frente a ese número.
## Requirements
### Requirement: Definir la meta de matriculados de una facultad

El sistema SHALL permitir a un ADMIN autenticado fijar la meta de matriculados de una facultad
activa. La meta SHALL ser un número entero mayor o igual a 1. Fijar la meta de una facultad que ya
la tenía SHALL reemplazar el valor anterior; no se conserva historial.

Ningún otro rol SHALL poder fijar una meta.

#### Scenario: El ADMIN fija la meta de una facultad sin meta

- **WHEN** un ADMIN fija la meta de una facultad activa que no tenía meta, con el valor 120
- **THEN** la facultad queda con meta 120
- **AND** el listado de metas la muestra con ese valor

#### Scenario: El ADMIN corrige una meta existente

- **WHEN** un ADMIN fija la meta de una facultad que ya tenía meta 120, con el valor 90
- **THEN** la facultad queda con meta 90, sin rastro del valor anterior

#### Scenario: La meta debe ser un entero positivo

- **WHEN** un ADMIN intenta fijar una meta con el valor 0, con un número negativo o con un decimal
- **THEN** el sistema rechaza la operación por validación
- **AND** la meta que hubiera antes queda intacta

#### Scenario: La facultad debe existir

- **WHEN** un ADMIN intenta fijar la meta de una facultad que no existe
- **THEN** el sistema responde que no se encontró, sin revelar nada más

#### Scenario: Un rol no autorizado intenta fijar una meta

- **WHEN** un APPLICANT, un STUDENT o un DEAN intenta fijar la meta de cualquier facultad
- **THEN** el sistema deniega la operación por permiso insuficiente
- **AND** ninguna meta cambia

#### Scenario: Sesión ausente o expirada

- **WHEN** alguien sin sesión válida intenta fijar una meta
- **THEN** el sistema responde que no está autenticado, sin distinguir si la facultad existe

### Requirement: Quitar la meta de una facultad

El sistema SHALL permitir a un ADMIN dejar una facultad sin meta. Una facultad sin meta SHALL
seguir apareciendo en el listado, con sus matriculados contados y su meta marcada como no definida.

Ningún otro rol SHALL poder quitar una meta.

#### Scenario: El ADMIN quita la meta

- **WHEN** un ADMIN quita la meta de una facultad que la tenía
- **THEN** la facultad queda sin meta definida
- **AND** el listado sigue mostrándola, con sus matriculados y sin porcentaje de avance

#### Scenario: Quitar una meta que no existe

- **WHEN** un ADMIN quita la meta de una facultad que no tenía ninguna
- **THEN** la operación termina bien y la facultad sigue sin meta

#### Scenario: Un rol no autorizado intenta quitar una meta

- **WHEN** un APPLICANT, un STUDENT o un DEAN intenta quitar la meta de una facultad
- **THEN** el sistema deniega la operación por permiso insuficiente

### Requirement: Consultar el avance de matriculados por facultad

El sistema SHALL ofrecer a un ADMIN autenticado un listado con una fila por cada facultad activa.
Cada fila SHALL incluir el nombre de la facultad, su meta (o la ausencia de meta), y cuántos
matriculados lleva.

Los matriculados de una facultad SHALL ser el número de inscripciones en estado `APPROVED` cuyo
programa pertenece a esa facultad. El conteo SHALL derivarse en el momento de la consulta.

Cuando la facultad tiene meta, la fila SHALL incluir además el avance como porcentaje de la meta.
Ese porcentaje SHALL poder superar el 100 %.

Las facultades inactivas SHALL quedar fuera del listado. Ningún otro rol SHALL poder consultarlo.

#### Scenario: Facultad con meta y matriculados

- **WHEN** un ADMIN consulta el listado y una facultad activa tiene meta 120 y 84 inscripciones
  aprobadas en sus programas
- **THEN** su fila muestra meta 120, 84 matriculados y un avance del 70 %

#### Scenario: Facultad que superó su meta

- **WHEN** una facultad tiene meta 40 y 52 inscripciones aprobadas
- **THEN** su fila muestra 52 matriculados y un avance del 130 %, sin recortarlo al 100 %

#### Scenario: Facultad sin meta definida

- **WHEN** una facultad activa no tiene meta y tiene 31 inscripciones aprobadas
- **THEN** su fila aparece igualmente, con 31 matriculados y la meta marcada como no definida
- **AND** no se muestra porcentaje de avance para esa fila

#### Scenario: Facultad sin matriculados

- **WHEN** una facultad activa tiene meta 50 y ninguna inscripción aprobada
- **THEN** su fila muestra 0 matriculados y un avance del 0 %

#### Scenario: Solo cuentan las inscripciones aprobadas

- **WHEN** una facultad tiene inscripciones en `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`,
  `PENDING_INTERVIEW` o `REJECTED`, y ninguna en `APPROVED`
- **THEN** su fila muestra 0 matriculados

#### Scenario: Las facultades inactivas no se listan

- **WHEN** un ADMIN consulta el listado y existe una facultad con `isActive` en falso
- **THEN** esa facultad no aparece, tenga meta o no

#### Scenario: Un rol no autorizado intenta consultar el listado

- **WHEN** un APPLICANT, un STUDENT o un DEAN pide el listado de metas
- **THEN** el sistema deniega la consulta por permiso insuficiente

#### Scenario: Sesión ausente o expirada

- **WHEN** alguien sin sesión válida pide el listado de metas
- **THEN** el sistema responde que no está autenticado

### Requirement: Pestaña de metas en el panel de administración

El panel de administración SHALL ofrecer una pestaña dedicada a las metas, alcanzable desde su
navegación, donde el ADMIN ve el listado de avance y edita la meta de cada facultad sin salir de
ella.

La pestaña SHALL ser inalcanzable para quien no sea ADMIN: la autorización se resuelve al entrar en
la ruta, no ocultando controles dentro de la pantalla.

#### Scenario: El ADMIN abre la pestaña

- **WHEN** un ADMIN autenticado entra en la pestaña de metas
- **THEN** ve una fila por facultad activa con meta, matriculados y avance

#### Scenario: El ADMIN edita una meta desde la pestaña

- **WHEN** el ADMIN cambia la meta de una facultad en la pestaña y confirma
- **THEN** la fila refleja la meta nueva y el avance recalculado, sin recargar la página

#### Scenario: Un rol no autorizado intenta abrir la pestaña

- **WHEN** un APPLICANT, un STUDENT o un DEAN navega a la dirección de la pestaña de metas
- **THEN** la aplicación lo redirige fuera de la zona de administración y no llega a pedir los datos

#### Scenario: Error al guardar una meta

- **WHEN** el intento de guardar una meta falla
- **THEN** la pestaña anuncia el error de forma accesible y conserva el valor que el ADMIN escribió

