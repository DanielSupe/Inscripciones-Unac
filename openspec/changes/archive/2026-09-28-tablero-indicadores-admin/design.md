## Context

Ver [proposal.md](./proposal.md) — Why.

Lo que ya existe y condiciona el diseño:

- `goalsService.listProgress()` devuelve una fila por facultad activa con su meta y sus
  matriculados. La meta global es una agregación de esas filas: no hace falta volver a consultar.
- Los datos del embudo son de `enrollment` y los de pagos de `receipt`. Cada módulo es dueño de su
  tabla, y los módulos se hablan por services.
- `AdminHome` (`apps/web/src/routes/role-routes.tsx`) cuelga de `adminLayout`, que ya resuelve el
  guard de rol ADMIN en el router.
- Las pruebas de la API corren sin paralelismo entre archivos (`fileParallelism: false`) contra su
  propio esquema, así que una prueba puede medir el cambio de un conteo sin carreras.

## Goals / Non-Goals

**Goals:**

- Un solo endpoint y una sola query para toda la pantalla: tres bloques, un viaje de red.
- Que ningún módulo nuevo toque tablas ajenas: el tablero compone, no consulta.
- Que el cálculo de la meta global sea una función pura, probable sin base de datos.

**Non-Goals:**

- Una capa genérica de métricas o reportes. Esto es una pantalla concreta.
- Cachear los conteos. Son tres agregaciones indexadas que solo pide el admin.

## Decisions

### Endpoint único `GET /admin/dashboard`

Una respuesta con los tres bloques. Descartado: un endpoint por bloque. Daría tres estados de carga
y tres de error en una pantalla que se lee de un vistazo, a cambio de una granularidad que nadie
necesita.

### Módulo `dashboard` sin repositorio

`apps/api/src/modules/dashboard/` tiene `routes`, `controller` y `service`, y ningún
`repository`. El service pide en paralelo:

| Dato | A quién | Método nuevo |
|---|---|---|
| Filas de meta por facultad | `goalsService` | ninguno: reutiliza `listProgress()` |
| Inscripciones por estado | `enrollmentService` | `countByStatus()` |
| Recibos por estado | `receiptService` | `countByStatus()` |

Cada `countByStatus()` es un `groupBy` en el repositorio de su módulo. El service de cada módulo
rellena con cero los estados que el `groupBy` no devolvió, recorriendo `ENROLLMENT_STATUSES` y
`PAYMENT_STATUSES`: el contrato promete todos los estados, y quien sabe cuáles son es el dueño del
dato.

Descartado: un `dashboard.repository.ts` que consulte directamente `enrollment` y
`payment_receipts`. Sería más corto, pero partiría la propiedad de esas tablas entre dos módulos, y
la regla del repo es justo la contraria.

### La meta global es una función pura

`summarizeGoals(rows: FacultyGoalRow[])` vive en `dashboard.service.ts` y se exporta para probarla
sola. Recibe las filas de `listProgress()` y devuelve:

- `globalTarget`: suma de `target` de las filas con meta; `null` si ninguna la tiene.
- `enrolledTowardGoal`: suma de `enrolledCount` de las filas con meta.
- `totalEnrolled`: suma de `enrolledCount` de todas las filas.
- `facultiesWithoutGoal`: cuántas filas tienen `target` en `null`.
- `progressPercent`: `enrolledTowardGoal / globalTarget`, redondeado; `null` sin meta global.

Las facultades inactivas ya vienen excluidas desde `listProgress()`, así que la regla de la spec
se cumple sin repetirla aquí.

### Contrato

En `packages/contracts/src/dashboard.ts`, reexportado desde el índice:

```ts
adminDashboardSchema = z.object({
  goal: z.object({
    globalTarget: z.number().int().nullable(),
    enrolledTowardGoal: z.number().int(),
    progressPercent: z.number().int().nullable(),
    totalEnrolled: z.number().int(),
    facultiesWithoutGoal: z.number().int(),
  }),
  funnel: z.record(enrollmentStatusSchema, z.number().int()),
  payments: z.record(paymentStatusSchema, z.number().int()),
});
```

`z.record` con un enum como clave exige todas las claves: el tipo inferido obliga al service a
devolver cada estado, y el frontend puede recorrerlos sin comprobar ausencias.

### Frontend dentro de la feature `admin`

- `useAdminDashboard()` en `features/admin/api/admin-queries.ts`, con la key
  `adminKeys.dashboard()`. Al colgar de `adminKeys.all`, cualquier mutación del panel que ya
  invalida `['admin']` —verificar un pago, crear un periodo— refresca también el tablero.
- `features/admin/components/admin-dashboard.tsx`: tres `<section>` con encabezado propio. Los
  números van en un `<dl>`; el avance lleva `<progress>` con `aria-label` y el porcentaje escrito.
  El embudo recorre `ENROLLMENT_STATUSES` en su orden canónico y nombra cada estado con
  `ESTADO_LABELS`, que ya vive en la misma feature.
- Carga con `role="status"`; error con `role="alert"`, nunca ceros de relleno.
- `AdminHome` conserva el título y reemplaza la ficha de correo y documento por el tablero; esos
  datos ya están en la cabecera del shell.

Descartado: una feature `dashboard` aparte. Tendría que importar `ESTADO_LABELS` de `admin`, y la
feature `admin` ya agrupa varias piezas de la consola.

### Configuración

Ninguna variable nueva.

## Risks / Trade-offs

- **Cifras acumuladas que crecen para siempre** → Consecuencia heredada de la meta global sin
  periodo. El tablero lo dice en pantalla; filtrar por periodo es el siguiente change natural.
- **Tres agregaciones en cada carga del inicio** → Cada una es un `groupBy` sobre columnas de
  estado. Si llegara a pesar, se añade un índice; no un contador que haya que mantener.
- **`listProgress()` ahora tiene dos consumidores** → Si la pestaña de metas cambia su forma, el
  tablero se entera en el typecheck, porque ambos dependen del mismo tipo del contrato.

## Migration Plan

Sin migración de base de datos. Despliegue normal de front y back; si se revierte, `/admin` vuelve
a la ficha anterior sin pérdida de datos.
