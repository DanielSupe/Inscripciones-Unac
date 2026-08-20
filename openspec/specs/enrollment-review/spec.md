# enrollment-review Specification

## Purpose

Le da al administrador de admisiones lo que necesita para responder: ver qué inscripciones
esperan, tomarlas para trabajarlas, mirar lo que el aspirante declaró y adjuntó, y decidir si
entra o si tiene que corregir.

## Requirements

### Requirement: El administrador ve las inscripciones que esperan respuesta

El sistema SHALL ofrecer al rol ADMIN un listado de inscripciones paginado, con filtro por estado
y por periodo académico, mostrando de cada una a quién pertenece, a qué programa aspira, **a qué
facultad corresponde**, en qué estado está y si su pago consta verificado.

El listado SHALL abarcar todo el proceso, también las inscripciones que ya entregó al decano, y
SHALL permitir distinguir las que esperan algo de él de las que esperan de otro.

Este listado SHALL estar reservado al rol ADMIN.

#### Scenario: Bandeja de inscripciones

- **WHEN** un administrador abre la bandeja
- **THEN** ve las inscripciones con el aspirante, el programa, la facultad, el estado y el estado
  del pago

#### Scenario: Filtro por estado

- **WHEN** un administrador filtra por las que están enviadas
- **THEN** solo ve esas, y no las que siguen sin enviar

#### Scenario: Las que ya pasaron al decano siguen consultables

- **WHEN** un administrador filtra por las que esperan entrevista
- **THEN** las ve, y puede abrirlas para responder a quien pregunte, sin poder actuar sobre ellas

#### Scenario: Las inscripciones sin enviar no aparecen por defecto

- **WHEN** un administrador abre la bandeja sin filtrar
- **THEN** no ve las inscripciones que los aspirantes todavía están diligenciando, porque
  todavía no se ha pedido nada sobre ellas

#### Scenario: Un rol no autorizado intenta abrirla

- **WHEN** una persona con rol APPLICANT o STUDENT, o alguien sin sesión, intenta abrir la
  bandeja
- **THEN** se rechaza por falta de permisos, sin devolver ninguna inscripción

### Requirement: El administrador alcanza cualquier inscripción

El rol ADMIN SHALL poder consultar el detalle de cualquier inscripción y abrir sus documentos
adjuntos, con independencia de a quién pertenezcan y del punto del proceso en que esté, incluida
la entrevista y la decisión del decano. Es la excepción declarada a la regla de que cada quien
solo ve lo suyo.

Esa visibilidad SHALL ser de **solo lectura** a partir del momento en que entrega la inscripción
al decano: el ADMIN puede responder por un proceso en curso, pero ya no interviene en él.

El rol DEAN SHALL poder consultar del mismo modo, pero **únicamente** las inscripciones cuyo
programa pertenezca a su facultad. Ante una de otra facultad, la respuesta SHALL ser la misma que
si no existiera.

#### Scenario: Detalle de una inscripción ajena

- **WHEN** un administrador abre el detalle de la inscripción de un aspirante cualquiera
- **THEN** ve todos los datos que este declaró, sus documentos y su recibo

#### Scenario: Abre un documento adjunto

- **WHEN** un administrador abre un documento de la inscripción que está revisando
- **THEN** puede verlo, mediante un acceso temporal como el de su propio dueño

#### Scenario: El administrador sigue el proceso después de entregarlo

- **WHEN** un administrador abre una inscripción que ya entregó al decano
- **THEN** ve en qué punto está, la fecha de la entrevista si la tiene y la decisión si ya se
  tomó, sin poder agendar ni decidir

#### Scenario: El decano abre una inscripción de su facultad

- **WHEN** un decano abre el detalle de una inscripción cuyo programa pertenece a su facultad
- **THEN** ve los datos declarados, los documentos y el recibo, igual que el administrador

#### Scenario: El decano ante una inscripción de otra facultad

- **WHEN** un decano intenta abrir el detalle de una inscripción de otra facultad
- **THEN** la respuesta es la misma que si esa inscripción no existiera

#### Scenario: La excepción no alcanza a otros roles

- **WHEN** una persona con rol APPLICANT intenta abrir el detalle de una inscripción ajena
- **THEN** la respuesta es la misma que si esa inscripción no existiera

### Requirement: El administrador toma una inscripción para revisarla

El sistema SHALL permitir al rol ADMIN tomar una inscripción enviada, lo que la pasa a estado de
revisión y deja constancia de quién la tomó y cuándo. El aspirante SHALL ver reflejado ese
avance en su proceso.

#### Scenario: Se toma una inscripción enviada

- **WHEN** un administrador toma para revisión una inscripción enviada
- **THEN** queda en revisión, a nombre de quien la tomó, y su aspirante lo ve así al consultar
  su proceso

#### Scenario: Se intenta tomar una que no está enviada

- **WHEN** un administrador intenta tomar una inscripción que sigue sin enviarse o que ya fue
  resuelta
- **THEN** la operación se rechaza y el estado no cambia

### Requirement: Aprobar una inscripción convierte al aspirante en estudiante

El sistema SHALL permitir **al rol DEAN** aprobar una inscripción de su facultad cuya entrevista
ya conste realizada y cuyo pago conste verificado. La aprobación y el cambio de rol del aspirante
a STUDENT SHALL ocurrir como una sola operación: no SHALL poder quedar una inscripción aprobada
cuyo aspirante siga sin ser estudiante, ni al revés.

El rol ADMIN SHALL NOT poder aprobar. Es la decisión académica, y la firma quien responde por el
programa.

#### Scenario: Aprobación tras la entrevista

- **WHEN** un decano aprueba una inscripción de su facultad cuya entrevista consta realizada y
  cuyo pago consta verificado
- **THEN** la inscripción queda aprobada y su aspirante pasa a tener el rol de estudiante

#### Scenario: El aspirante lo ve en su siguiente ingreso

- **WHEN** una persona cuya inscripción fue aprobada vuelve a iniciar sesión
- **THEN** entra a la zona de estudiante, y ve su inscripción en solo lectura

#### Scenario: Aprobación sin la entrevista realizada

- **WHEN** un decano intenta aprobar una inscripción cuya entrevista sigue agendada o ni siquiera
  tiene fecha
- **THEN** la operación se rechaza indicando que falta realizar la entrevista, y nada cambia

#### Scenario: Aprobación sin el pago verificado

- **WHEN** se intenta aprobar una inscripción cuyo pago sigue pendiente
- **THEN** la operación se rechaza indicando que falta verificar el pago, la inscripción no
  cambia de estado y el aspirante conserva su rol

#### Scenario: Nada queda a medias

- **WHEN** la aprobación no puede completarse por cualquier motivo
- **THEN** ni la inscripción queda aprobada ni el rol cambia

#### Scenario: El administrador intenta aprobar

- **WHEN** una persona con rol ADMIN intenta aprobar una inscripción
- **THEN** se rechaza por falta de permisos y nada cambia

#### Scenario: Un decano intenta aprobar fuera de su facultad

- **WHEN** un decano intenta aprobar una inscripción cuyo programa pertenece a otra facultad
- **THEN** se le responde igual que si esa inscripción no existiera

#### Scenario: Un rol no autorizado intenta aprobar

- **WHEN** una persona con rol APPLICANT o STUDENT intenta aprobar una inscripción
- **THEN** se rechaza por falta de permisos y nada cambia

### Requirement: Rechazar exige explicar por qué

El sistema SHALL permitir rechazar una inscripción indicando obligatoriamente un motivo escrito,
que SHALL quedar visible para el aspirante. Un rechazo SHALL NOT poder guardarse sin motivo.

Pueden rechazar dos roles, en momentos distintos del proceso:

- El **ADMIN**, mientras la inscripción está en revisión, por un problema de trámite: un documento
  que no se lee, un pago que no aparece.
- El **DEAN**, sobre una inscripción de su facultad, una vez realizada la entrevista, o después
  de una inasistencia mientras la inscripción espera fecha.

Ninguno de los dos SHALL poder rechazar fuera de esos momentos.

#### Scenario: Rechazo administrativo por un documento ilegible

- **WHEN** un administrador rechaza, escribiendo el motivo, una inscripción que tiene en revisión
- **THEN** la inscripción queda rechazada, y su aspirante lee ese motivo al consultar su proceso

#### Scenario: Rechazo del decano tras la entrevista

- **WHEN** un decano rechaza, escribiendo el motivo, una inscripción de su facultad cuya
  entrevista consta realizada
- **THEN** la inscripción queda rechazada y su aspirante lee el motivo

#### Scenario: Rechazo del decano tras una inasistencia

- **WHEN** un decano rechaza, escribiendo el motivo, una inscripción que volvió a esperar fecha
  porque el aspirante no se presentó
- **THEN** la inscripción queda rechazada y su aspirante lee el motivo

#### Scenario: Rechazo sin motivo

- **WHEN** se intenta rechazar una inscripción sin escribir un motivo, o escribiendo solo espacios
- **THEN** la operación se rechaza y la inscripción no cambia de estado

#### Scenario: El administrador intenta rechazar algo que ya entregó

- **WHEN** un administrador intenta rechazar una inscripción que ya está en manos del decano
- **THEN** la operación se rechaza: dejó de ser suya al entregarla

#### Scenario: El aspirante puede corregir después

- **WHEN** un aspirante cuya inscripción fue rechazada la corrige y la reenvía
- **THEN** vuelve a aparecer en la bandeja del administrador como enviada, lista para revisarse
  de nuevo desde el principio

### Requirement: El administrador entrega la inscripción al decano

El sistema SHALL permitir al rol ADMIN entregar al decano una inscripción que tenga en revisión,
siempre que los documentos exigidos estén completos y el pago conste verificado. La entrega SHALL
llevarla a la espera de entrevista y SHALL dejar constancia de quién la entregó y cuándo.

La inscripción SHALL quedar bajo el decano de la facultad a la que pertenece el programa elegido.
El sistema SHALL determinar ese destino por sí mismo; SHALL NOT aceptar que quien entrega elija a
qué decano va.

Si el programa elegido pertenece a una facultad **sin decano asignado**, la entrega SHALL
rechazarse explicando esa causa, en lugar de dejar la inscripción en un limbo donde nadie la ve.

#### Scenario: Entrega con todo conforme

- **WHEN** un administrador entrega una inscripción que tiene en revisión, con los documentos
  completos y el pago verificado
- **THEN** la inscripción pasa a esperar entrevista bajo el decano de la facultad de su programa,
  y el aspirante lo ve así en su proceso

#### Scenario: Entrega con el pago pendiente

- **WHEN** un administrador intenta entregar una inscripción cuyo pago no consta verificado
- **THEN** la operación se rechaza indicando que falta verificar el pago, y el estado no cambia

#### Scenario: Entrega con documentos incompletos

- **WHEN** un administrador intenta entregar una inscripción a la que le falta alguno de los
  documentos exigidos
- **THEN** la operación se rechaza indicando cuáles faltan, y el estado no cambia

#### Scenario: Entrega de una que no está en revisión

- **WHEN** un administrador intenta entregar una inscripción que sigue enviada sin tomar, o que
  ya entregó
- **THEN** la operación se rechaza y el estado no cambia

#### Scenario: La facultad no tiene decano

- **WHEN** un administrador intenta entregar una inscripción cuyo programa pertenece a una
  facultad sin decano asignado
- **THEN** la operación se rechaza explicando esa causa, y la inscripción sigue en revisión

#### Scenario: No se elige a quién entregar

- **WHEN** una petición de entrega incluye un decano de destino entre sus datos
- **THEN** ese dato se ignora, y el destino se resuelve por la facultad del programa elegido

#### Scenario: Un rol no autorizado intenta entregar

- **WHEN** una persona con rol APPLICANT, STUDENT o DEAN intenta entregar una inscripción
- **THEN** se rechaza por falta de permisos y nada cambia

### Requirement: El decano ve las inscripciones de su facultad que esperan respuesta

El sistema SHALL ofrecer al rol DEAN un listado paginado de las inscripciones **de su facultad**
que ya le fueron entregadas, con filtro por estado y por periodo académico, mostrando de cada una
a quién pertenece, a qué programa aspira, en qué punto está y la fecha de su entrevista cuando la
tenga.

El listado SHALL NOT incluir inscripciones de otras facultades, ni las que el administrador
todavía no ha entregado. Un decano SHALL NOT poder ampliar ese alcance mediante ningún dato de la
petición.

#### Scenario: Bandeja del decano

- **WHEN** un decano abre su bandeja
- **THEN** ve las inscripciones de su facultad que le fueron entregadas, con el aspirante, el
  programa, el estado y la fecha de entrevista si la hay

#### Scenario: No ve las de otras facultades

- **WHEN** un decano abre su bandeja mientras existen inscripciones entregadas a otras facultades
- **THEN** no aparece ninguna de ellas

#### Scenario: No ve las que aún no le entregaron

- **WHEN** existe una inscripción de su facultad que el administrador todavía tiene en revisión
- **THEN** no aparece en la bandeja del decano

#### Scenario: Intento de ampliar el alcance

- **WHEN** un decano pide su bandeja indicando en la petición otra facultad
- **THEN** ese dato se ignora y sigue viendo únicamente la suya

#### Scenario: Un rol no autorizado intenta abrirla

- **WHEN** una persona con rol APPLICANT, STUDENT o ADMIN, o alguien sin sesión, intenta abrir la
  bandeja del decano
- **THEN** se rechaza por falta de permisos, sin devolver ninguna inscripción
