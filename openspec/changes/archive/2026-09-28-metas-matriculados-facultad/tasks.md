## 1. Contrato y modelo de datos

- [x] 1.1 Crear `packages/contracts/src/goals.ts` con `setFacultyGoalSchema` (`target` entero
      `>= 1`) y `facultyGoalRowSchema` (`facultyId`, `facultyName`, `target` nulable,
      `enrolledCount`, `progressPercent` nulable), derivando los tipos con `z.infer`, y
      reexportarlo desde el índice del paquete.
- [x] 1.2 Añadir el modelo `FacultyEnrollmentGoal` a `apps/api/prisma/schema.prisma` según
      design.md, con su `@@map`, el `@unique` sobre `facultyId` y la relación inversa en `Faculty`.
- [x] 1.3 Crear la migración de Prisma que añade la tabla y verificar que no toca ninguna otra.

## 2. Backend

- [x] 2.1 Crear `goals.repository.ts` con `upsertGoal`, `deleteGoal` y `findFacultyProgress`; esta
      última resuelve el listado con las facultades activas más un `groupBy` de inscripciones
      `APPROVED` por programa, sin traer filas para contarlas en memoria.
- [x] 2.2 Crear `goals.mapper.ts` que convierta la fila agregada en el DTO del contrato, dejando
      `target` y `progressPercent` en `null` cuando la facultad no tiene meta.
- [x] 2.3 Crear `goals.service.ts`: comprueba la existencia de la facultad vía `catalogService`
      (añadiendo ahí el método si falta, nunca importando su repository), lanza `NotFoundError`
      cuando no existe, y deriva el porcentaje redondeado al entero más cercano.
- [x] 2.4 Crear `goals.controller.ts` que valide el cuerpo con `setFacultyGoalSchema`, lance
      `ValidationError` con los errores por campo y fije los status; sin Prisma ni reglas de negocio.
- [x] 2.5 Crear `goals.admin.routes.ts` con `GET`, `PUT` y `DELETE` sobre
      `/admin/faculty-goals`, todas tras `requireAuth` y `requireRole('ADMIN')`, y montarlas en
      `apps/api/src/app.ts` junto a las demás rutas de administración.

## 3. Frontend

- [x] 3.1 Crear `apps/web/src/features/goals/api/goals-queries.ts` con la query key del listado y
      las mutaciones de fijar y quitar meta, invalidando esa key al terminar.
- [x] 3.2 Crear `components/goals-table.tsx`: una fila por facultad con meta editable, matriculados,
      porcentaje escrito como texto y un `<progress>` con `aria-label`; `<label>` asociado a cada
      input y el error de guardado anunciado en una región accesible.
- [x] 3.3 Enunciar en la cabecera de la pestaña que los matriculados son el total acumulado, no los
      del periodo en curso, para que la cifra no se lea mal.
- [x] 3.4 Registrar la ruta `/admin/metas` como hija de `adminLayout` en `router.tsx`, sin añadir
      ninguna comprobación de rol dentro del componente.
- [x] 3.5 Añadir `{ label: 'Metas', to: '/admin/metas' }` a `NAV_BY_ROLE.ADMIN` en
      `apps/web/src/components/navigation.ts`.

## 4. Cierre

- [x] 4.1 Ejecutar `pnpm lint` y `pnpm typecheck`, y dejar el árbol limpio.
- [x] 4.2 Aplicar la migración en el Postgres local y comprobar a mano en la pestaña los tres casos
      que distinguen el diseño: facultad con meta, facultad sin meta y facultad que la superó.

> **Pruebas omitidas a petición explícita del usuario.** Este change no lleva tareas de prueba,
> aunque toca permisos de endpoints nuevos —justo lo que las convenciones del repo exigen probar—.
> Queda anotado aquí para que el hueco sea visible y no se confunda con un descuido: las pruebas del
> service de metas y de la autorización de los tres endpoints son trabajo pendiente.
