## 1. Contrato

- [x] 1.1 Crear `packages/contracts/src/dashboard.ts` con `adminDashboardSchema` según design.md,
      derivar `AdminDashboard` con `z.infer` y reexportarlo desde el índice.

## 2. Backend

- [x] 2.1 Añadir `countByStatus()` a `enrollment.repository.ts` (un `groupBy` por `status`) y a
      `enrollment.service.ts`, que devuelve todos los estados de `ENROLLMENT_STATUSES`, con cero
      en los que no aparezcan.
- [x] 2.2 Añadir `countByStatus()` a `receipt.repository.ts` y a `receipt.service.ts`, con la misma
      regla de rellenar con cero sobre `PAYMENT_STATUSES`.
- [x] 2.3 Crear `dashboard.service.ts` con `summarizeGoals()` exportada como función pura y
      `getDashboard()`, que pide en paralelo a `goalsService`, `enrollmentService` y
      `receiptService`.
- [x] 2.4 Crear `dashboard.controller.ts` y `dashboard.admin.routes.ts` con
      `GET /admin/dashboard` tras `requireAuth` y `requireRole('ADMIN')`, y montarlo en `app.ts`.

## 3. Frontend

- [x] 3.1 Añadir `adminKeys.dashboard()` y `useAdminDashboard()` en
      `features/admin/api/admin-queries.ts`.
- [x] 3.2 Crear `features/admin/components/admin-dashboard.tsx` con los tres bloques: meta global
      (con enlace a Metas, aviso de cifras acumuladas y de facultades fuera del cálculo), embudo por
      estado en orden canónico y pagos; carga y error accesibles.
- [x] 3.3 Hacer que `AdminHome` muestre el tablero en lugar de la ficha de correo y documento.

## 4. Pruebas

- [x] 4.1 Probar `summarizeGoals()` sin base de datos con los escenarios de la spec: todas con
      meta, una sin meta que no altera el avance, ninguna con meta y meta superada.
- [x] 4.2 Probar `GET /admin/dashboard`: 401 sin sesión, 403 para APPLICANT y DEAN, y 200 para
      ADMIN con todos los estados en el embudo y en los pagos.
- [x] 4.3 Probar que crear una inscripción en borrador sube en uno el conteo de `DRAFT` del
      embudo.

## 5. Cierre

- [x] 5.1 Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm test`.
