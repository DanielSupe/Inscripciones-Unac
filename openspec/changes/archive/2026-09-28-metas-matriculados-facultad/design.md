## Context

Ver [proposal.md](./proposal.md) — Why.

Lo que ya existe y condiciona el diseño:

- `Faculty` agrupa `AcademicProgram`, y `Enrollment` apunta a un programa (`programId`, nulable
  mientras la inscripción es borrador). La cadena facultad → programas → inscripciones ya está,
  así que el conteo de matriculados no necesita ninguna columna nueva.
- La zona de administración del frontend es un layout con guard de rol en la ruta padre
  (`adminLayout` en `apps/web/src/router.tsx`) del que cuelgan `/admin/usuarios`,
  `/admin/aspirantes` y `/admin/periodos`. El menú lateral sale de `NAV_BY_ROLE` en
  `apps/web/src/components/navigation.ts`.
- En el backend, el patrón a replicar es un módulo por dominio con las capas
  `routes → controller → service → repository`. **`catalog.admin.routes.ts` no es ese patrón**:
  mete Prisma y validación dentro del handler. Es deuda existente; este change no la copia.

## Goals / Non-Goals

**Goals:**

- Guardar la meta sin tocar la forma de ninguna tabla existente.
- Resolver el listado de avance en una sola consulta agregada, no en N+1 consultas por facultad.
- Dejar el módulo preparado para que atar la meta al periodo académico sea añadir una columna y una
  clave única, no reescribir el módulo.

**Non-Goals:**

- Cachear o materializar el conteo de matriculados.
- Introducir una capa de reportes genérica; esto es una pantalla concreta.

## Decisions

### Modelo: tabla propia `FacultyEnrollmentGoal`, no una columna en `Faculty`

```prisma
/// Meta de matriculados de una facultad. Vive en su propia tabla y no como
/// columna de Faculty porque «sin meta» y «meta cero» son cosas distintas, y
/// porque la meta por periodo —el paso siguiente— solo necesita añadir aquí la
/// columna periodId y ampliar la clave única.
model FacultyEnrollmentGoal {
  id        String   @id @default(cuid())
  facultyId String   @unique
  faculty   Faculty  @relation(fields: [facultyId], references: [id])
  /// Cuántos matriculados se esperan. Siempre >= 1: la ausencia de meta se
  /// representa borrando la fila, no guardando un cero.
  target    Int
  updatedAt DateTime @updatedAt

  @@map("faculty_enrollment_goals")
}
```

Alternativa descartada: `Faculty.enrollmentTarget Int?`. Es una columna menos, pero obliga a que
`Faculty` cargue con un dato de reporte, y al atar la meta al periodo habría que sacarla de ahí de
todos modos. La tabla aparte cuesta una migración igual y no hipoteca el paso siguiente.

Fijar la meta es un `upsert` por `facultyId`; quitarla es un `deleteMany` por `facultyId`, que es
idempotente y no falla si no había fila.

### Conteo: agregación en la base de datos, nunca en memoria

El repositorio resuelve el listado con dos consultas: las facultades activas con su meta incluida, y
un `groupBy` de `Enrollment` por `programId` restringido a `status: 'APPROVED'`, sumado por facultad
a partir del programa. Traer las inscripciones y contarlas en JavaScript funcionaría hoy con datos
de prueba y se caería con el volumen de un semestre real.

El porcentaje de avance **no se guarda ni se calcula en el repositorio**: lo deriva el service al
armar el DTO, redondeado al entero más cercano, y es `null` cuando no hay meta. Un `null` aquí no es
lo mismo que un 0: el frontend lo pinta como «sin meta definida».

### Capas y ubicación

Módulo nuevo `apps/api/src/modules/goals/`:

| Archivo | Responsabilidad |
|---|---|
| `goals.admin.routes.ts` | Monta las rutas con `requireAuth` y `requireRole('ADMIN')`. Sin lógica. |
| `goals.controller.ts` | Valida el cuerpo con Zod, traduce a llamadas del service y fija el status. |
| `goals.service.ts` | Verifica que la facultad exista y esté activa, deriva el porcentaje, lanza los errores de dominio. |
| `goals.repository.ts` | Único sitio con `prisma`: el `upsert`, el borrado y las dos consultas del listado. |
| `goals.mapper.ts` | Fila de base de datos → DTO público. |

La facultad se consulta a través de `catalogService`, no importando `catalog.repository`. Si el
catálogo no expone todavía «dame la facultad por id», se añade ahí ese método en vez de saltarse la
regla.

Endpoints, bajo el prefijo de administración que ya usan los demás:

- `GET /admin/faculty-goals` → listado de avance.
- `PUT /admin/faculty-goals/:facultyId` → fija la meta (`{ target: number }`). `PUT` porque la
  operación es idempotente: el mismo cuerpo dos veces deja el mismo estado.
- `DELETE /admin/faculty-goals/:facultyId` → quita la meta. Responde igual haya fila o no.

### Contratos

En `packages/contracts`, archivo nuevo `goals.ts` reexportado desde el índice:

- `setFacultyGoalSchema` — `z.object({ target: z.number().int().min(1) })`. El `int()` es lo que
  rechaza el decimal, y el `min(1)` lo que hace del cero un valor inválido en lugar de un borrado
  encubierto.
- `facultyGoalRowSchema` — `facultyId`, `facultyName`, `target: number | null`,
  `enrolledCount: number`, `progressPercent: number | null`.
- Los tipos se derivan con `z.infer`; no se escribe ninguna interfaz a mano.

### Frontend

Feature nueva `apps/web/src/features/goals/`:

- `api/goals-queries.ts` — la query key (`['admin', 'faculty-goals']`) y las mutaciones, que
  invalidan esa key al terminar. Nada de keys inline en los componentes.
- `components/goals-table.tsx` — la tabla, con la edición en la propia fila: un `input type="number"`
  con su `<label>` asociado (el nombre de la facultad), el botón de guardar y el de quitar la meta.
- La barra de avance es un `<progress>` nativo con `aria-label`, y el porcentaje también va escrito
  como texto: el color por sí solo no comunica nada a quien no lo ve.
- Ruta `/admin/metas`, hija de `adminLayout`, que hereda el guard de rol del padre. Enlace nuevo
  `{ label: 'Metas', to: '/admin/metas' }` en `NAV_BY_ROLE.ADMIN`.

### Configuración

Ninguna variable de entorno nueva. La meta es un dato de negocio que el admin edita en caliente, no
configuración de despliegue: ponerla en env obligaría a un redespliegue para cambiar un número.

## Risks / Trade-offs

- **La meta global acumula entre periodos** → Es la decisión explícita del usuario, anotada como
  supuesto en el proposal. Se mitiga dejando el modelo listo para que `periodId` entre después sin
  reescribir nada; hasta entonces, la pestaña lo enuncia: dice «matriculados en total», no «este
  semestre».
- **El conteo se recalcula en cada carga de la pestaña** → Es una agregación sobre una tabla
  indexada por `programId` y filtrada por estado, y la pantalla la abre solo el admin. Si alguna vez
  pesa, la salida es un índice compuesto, no un contador desnormalizado que habría que mantener
  sincronizado con cada aprobación.
- **Una facultad puede desactivarse conservando su meta** → La fila sobrevive y no se lista. Es
  deliberado: reactivar la facultad recupera su meta en lugar de perderla en silencio.

## Migration Plan

1. Migración de Prisma que crea `faculty_enrollment_goals`. Solo añade una tabla: no reescribe
   datos, no bloquea tablas existentes y es segura de aplicar con la app arriba.
2. Rollback: eliminar la tabla. Ningún dato existente depende de ella, así que volver atrás no
   pierde nada más que las metas capturadas.
3. No hay seed: las facultades arrancan sin meta, que es un estado válido.
