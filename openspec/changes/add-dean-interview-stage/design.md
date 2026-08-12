## Context

Ver `proposal.md` — Why.

Lo que condiciona el diseño, y que ya está en el código:

- `enrollment.transitions.ts` es el guardián único de las transiciones: declara las acciones, sus
  estados de origen y sus condiciones, y es puro. Los servicios lo invocan; nadie cambia un estado
  sin pasar por él. Este change lo hace crecer, no lo sustituye.
- La autorización por fila ya tiene su forma: el repositorio mete la pertenencia **dentro** de la
  cláusula de la consulta, de modo que un recurso ajeno se lee como ausente. El alcance del decano
  es el mismo patrón con otro criterio.
- Aprobar y promover a STUDENT ya ocurren en una transacción. Cambia quién lo dispara, no cómo.
- `AcademicProgram` no cuelga de nada. La facultad es estructura nueva.
- El admin semilla se crea desde `prisma/seed.ts` leyendo credenciales del entorno, y es
  idempotente. Los decanos siguen ese mismo camino.
- No hay correo. «Que el aspirante esté enterado» solo puede significar que lo vea al entrar.

## Goals / Non-Goals

**Goals**

- Que el reparto de decisiones quede expresado en el guardián de transiciones y no repartido por
  los controladores.
- Que el alcance del decano se resuelva en la consulta, no filtrando en memoria después.
- Que la entrevista conserve historia, para que una segunda inasistencia sea un hecho y no un
  recuerdo.

**Non-Goals**

- No se construye un calendario ni un modelo de disponibilidad.
- No se toca el flujo del aspirante hasta el envío: los tres pasos y sus documentos quedan igual.
- No se introduce cola, tarea programada ni ningún disparador por tiempo.

## Decisions

### La facultad es una entidad, y el programa cuelga de ella obligatoriamente

`Faculty` con código estable, nombre y un decano opcional. `AcademicProgram.facultyId` es
**obligatorio**: un programa sin facultad produciría inscripciones que no pueden llegar a nadie,
y ese es exactamente el fallo que no queremos descubrir en producción.

*Alternativa descartada:* colgar el decano de una lista de programas, sin entidad intermedia.
Ahorra una tabla pero la palabra «facultad» desaparece del dominio, y reasignar programas pasa a
ser mantener listas a mano en varios sitios.

### Un decano por facultad, expresado con un índice único

El vínculo vive en `Faculty.deanUserId`, único. Un índice único hace imposible que dos facultades
compartan decano; que la facultad tenga como mucho uno lo garantiza la propia columna.

Se modela así y no con un `facultyId` en `User` porque la relación pertenece a la facultad: una
facultad sin decano es un estado que interesa consultar y señalar, y en el otro sentido sería un
campo nulo en todas las cuentas que no son decanos.

### La entrevista es una entidad con historia

`Interview` cuelga de la inscripción. Reagendar **actualiza** la entrevista vigente: es la misma
cita movida. Declarar el resultado la **cierra**, y una inasistencia deja la inscripción a la
espera de que se cree una nueva.

Así, contar inasistencias es contar filas cerradas con ese resultado, y no hace falta un contador
que alguien tenga que acordarse de incrementar.

La entrevista vigente es la única sin resultado. Que no pueda haber dos abiertas a la vez es una
invariante que el servicio hace cumplir al crearla.

*Alternativa descartada:* un par de campos en `Enrollment`. Cabría hoy y se rompería a la primera
inasistencia, porque la fecha nueva pisaría la anterior y con ella la prueba de lo ocurrido.

### Tres estados nuevos, y el guardián sigue siendo uno

`EnrollmentStatus` suma `PENDING_INTERVIEW`, `INTERVIEW_SCHEDULED` e `INTERVIEW_HELD`. Las
acciones nuevas —`handOver`, `schedule`, `markHeld`, `markNoShow`— se declaran junto a las que ya
existen, con sus estados de origen y sus condiciones.

`approve` cambia de origen: ya no sale de `UNDER_REVIEW` sino de `INTERVIEW_HELD`. `reject`
admite dos orígenes, `UNDER_REVIEW` para el trámite y `INTERVIEW_HELD` o `PENDING_INTERVIEW` para
la decisión académica.

Que la tabla de transiciones sea el único sitio donde esto se declara es lo que permite que el
cambio de manos no se filtre a los controladores en forma de condicionales sueltos.

### El rol autorizado se comprueba junto a la transición, no solo en la ruta

Cada acción declara además **qué rol** puede dispararla. La ruta sigue declarando sus roles —el
borde rechaza lo evidente sin tocar la base de datos—, pero la regla de que aprobar es del decano
vive donde vive la transición. Si algún día se añade otra vía para aprobar, seguirá pasando por
ahí.

### El alcance del decano se resuelve en la consulta

Como la pertenencia del aspirante: el repositorio compone la cláusula con la facultad de la
sesión, de modo que una inscripción de otra facultad **no se encuentra**, en vez de encontrarse y
descartarse. La diferencia importa: comparar una respuesta «no existe» con una «no autorizado»
revela qué inscripciones hay.

El criterio es `enrollment.program.faculty.deanUserId = <usuario de la sesión>`, y no un
`facultyId` guardado en la inscripción. Se deriva del programa elegido, que es la fuente de
verdad; duplicarlo en la inscripción abriría la puerta a que quedaran en desacuerdo.

### Quién revisó y quién decidió son dos campos

`Enrollment` conserva `reviewedByUserId`/`reviewedAt` para el ADMIN que la tomó y la entregó, y
suma `decidedByUserId`/`decidedAt` para el DEAN que aprobó o rechazó. Reutilizar el mismo campo
borraría el rastro de uno de los dos, y el reparto de responsabilidad es justo lo que este change
introduce.

### Módulos

```
modules/interview/   nuevo — agendar, mover, declarar resultado
modules/enrollment/  + entregar al decano; approve/reject cambian de dueño
modules/catalog/     + facultades y su decano
```

`interview` habla con `enrollment` a través de su servicio, nunca de su repositorio: es la
transición de la inscripción la que decide si una entrevista puede agendarse.

### Frontend

Zona nueva `features/dean/` con su bandeja y el detalle, espejo de `features/admin/`. La consola
del ADMIN pierde el botón de aprobar y gana el de entregar, y su detalle muestra la entrevista y
la decisión en solo lectura. El proceso del aspirante gana los estados nuevos y la ficha de la
cita.

## Modelo de datos

```prisma
enum Role { APPLICANT  STUDENT  ADMIN  DEAN }

enum EnrollmentStatus {
  DRAFT  SUBMITTED  UNDER_REVIEW
  PENDING_INTERVIEW  INTERVIEW_SCHEDULED  INTERVIEW_HELD
  APPROVED  REJECTED
}

enum InterviewModality { ON_SITE  VIRTUAL }
enum InterviewOutcome  { HELD  NO_SHOW }

model Faculty {
  id         String  @id @default(cuid())
  code       String  @unique
  name       String
  isActive   Boolean @default(true)
  deanUserId String? @unique          // único: nadie dirige dos facultades
  dean       User?   @relation("FacultyDean", fields: [deanUserId], references: [id])
  programs   AcademicProgram[]
}

model AcademicProgram {
  facultyId String                    // obligatorio
  faculty   Faculty @relation(fields: [facultyId], references: [id])
}

model Interview {
  id            String            @id @default(cuid())
  enrollmentId  String
  scheduledAt   DateTime                       // en UTC
  modality      InterviewModality
  location      String?                        // presencial
  meetingUrl    String?                        // virtual
  outcome       InterviewOutcome?              // nula mientras esté vigente
  closedAt      DateTime?
  scheduledByUserId String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Enrollment {
  decidedByUserId String?           // el decano que aprobó o rechazó
  decidedAt       DateTime?
  interviews      Interview[]
}
```

Índices: `Interview(enrollmentId, outcome)` para encontrar la vigente sin recorrer el historial, y
`Faculty.deanUserId` ya único.

**Migración.** El paso delicado es hacer obligatorio `facultyId` sobre programas que ya existen.
En una sola migración: crear `Faculty`, insertar las facultades, añadir `facultyId` como nulable,
rellenarlo cruzando por el código del programa, y solo entonces imponer la restricción. Si algún
programa quedara sin facultad, la migración falla ahí y no deja el esquema a medias.

La semilla vuelve a crear esas mismas facultades por código, de forma idempotente, para las bases
de datos que nacen ya con el esquema nuevo. Los códigos son estables, así que ambos caminos
convergen.

## Variables de entorno

| Variable | Ejemplo para `.env.example` | Para qué |
|---|---|---|
| `SEED_DEAN_EMAIL_DOMAIN` | `unac.edu.co` | Dominio de los correos de decano sembrados; el nombre sale del código de la facultad |
| `SEED_DEAN_PASSWORD` | `CambiaEstaClave2026` | Contraseña inicial de las cuentas de decano |

Ambas requeridas al sembrar, validadas en `packages/config` con el resto, y la aplicación falla
ruidosamente si faltan. Se añaden en el mismo commit al `.env.example` de `apps/api`.

## Impacto en el despliegue

No cambia nada de CORS, cookies ni almacenamiento de archivos. Sí hay que tener en cuenta dos
cosas al desplegar:

- La migración incluye datos, no solo esquema. Debe correr antes de que arranque la aplicación,
  como las demás.
- Las variables de semilla han de existir en el entorno del backend **antes** de sembrar, o la
  siembra se detiene.

## Risks / Trade-offs

- **Todos los decanos nacen con la misma contraseña inicial.** Es una credencial compartida que,
  si nadie la cambia, sobrevive al despliegue. → Se documenta que el ADMIN debe restablecer cada
  una tras el primer arranque, para lo que ya existe la pantalla; y la variable se llama de forma
  que dé vergüenza dejarla como está. Si se prefiere, la alternativa es sembrar los decanos sin
  contraseña utilizable y obligar a que el ADMIN la fije uno por uno: más seguro, pero nada
  funciona hasta que alguien lo haga a mano.
- **Una facultad sin decano bloquea a sus aspirantes.** Puede ocurrir eliminando la cuenta. → La
  entrega se rechaza con una causa explícita en vez de dejar la inscripción invisible, pero el
  change no ofrece forma de reasignar: hay que crear el decano. Queda anotado como trabajo
  siguiente.
- **Nada obliga a cerrar una entrevista.** Una inscripción puede quedarse con la fecha pasada y
  sin resultado indefinidamente, y nadie recibe un aviso. → Es la consecuencia aceptada de no
  tener ni correo ni tareas programadas. La bandeja del decano puede ordenar por fecha para que
  las vencidas salgan primero.
- **El decano puede citar a dos personas a la misma hora.** No hay comprobación de choques. →
  Fuera de alcance declarado; la agenda real vive en el calendario del decano.
- **El camino se alarga de cinco estados a ocho.** Más estados es más superficie donde
  equivocarse. → Todos se declaran en el mismo archivo de transiciones y todos se prueban; es el
  motivo por el que ese archivo existe.

## Migration Plan

1. Migración de esquema con el relleno de facultades descrito arriba.
2. Sembrar, lo que crea o completa facultades y decanos de forma idempotente.
3. Desplegar backend y frontend.

Las inscripciones ya `APPROVED` o `REJECTED` no se tocan. Las que estén en `UNDER_REVIEW` al
desplegar siguen ahí y su administrador ya no verá el botón de aprobar: tendrá que entregarlas.
Es el comportamiento correcto y no requiere migrar datos.

Volver atrás exige revertir la migración, y con ella las entrevistas registradas. Mientras el
sistema no esté en producción con datos reales, el riesgo es nulo.

## Open Questions

- El nombre definitivo de las facultades de la UNAC y el reparto exacto de los ocho programas
  sembrados. Entra como datos en la semilla, que este change deja construida; no cambia las
  specs, el enfoque ni el reparto de tareas.
