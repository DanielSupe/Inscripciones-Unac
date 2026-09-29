## 1. Contrato y modelo de datos

- [x] 1.1 Añadir `CANCELLED` a `INTERVIEW_OUTCOMES` en `packages/contracts/src/domain.ts`, con su
      etiqueta en español («Anulada por la decisión»), y revisar que ningún mapeo del enum se apoye
      en un `default` que se trague el valor nuevo.
- [x] 1.2 Añadir `CANCELLED` al enum `InterviewOutcome` en `apps/api/prisma/schema.prisma` y crear la
      migración correspondiente.
- [x] 1.3 Ajustar el comentario del enum en el esquema para decir qué significa el tercer desenlace:
      la cita que la decisión dejó sin efecto.

## 2. Backend: transición y aprobación

- [x] 2.1 En `enrollment.transitions.ts`, abrir `approve` a `PENDING_INTERVIEW`,
      `INTERVIEW_SCHEDULED` e `INTERVIEW_HELD`, con un mensaje de rechazo que hable de estar en manos
      de la facultad, y actualizar el diagrama de la cabecera del archivo.
- [x] 2.2 En `enrollmentRepository.approveAndPromote`, quitar las comprobaciones del recibo y de la
      entrevista realizada, simplificar el tipo de retorno y cerrar como `CANCELLED`, dentro de la
      misma transacción, las entrevistas de esa inscripción que sigan sin resultado.
- [x] 2.3 En `enrollment.review.service.ts`, eliminar la traducción de los motivos desaparecidos de
      `approve`, dejando la autorización por facultad y el guardián de transiciones como únicas
      comprobaciones.
- [x] 2.4 Verificar que el rechazo del decano y el `markHeld` siguen exigiendo lo mismo que antes, y
      que ninguna de las dos rutas quedó tocada por el cambio anterior.

## 3. Frontend

- [x] 3.1 En `dean-detail.tsx`, habilitar «Aprobar» en todo el tramo del decano mientras la
      inscripción no esté resuelta, sustituyendo la condición sobre `INTERVIEW_HELD` y el aviso que
      la acompaña.
- [x] 3.2 Pedir confirmación explícita antes de aprobar y, cuando haya cita agendada, advertir en esa
      confirmación que quedará sin efecto.
- [x] 3.3 En `process-panel.tsx`, mostrar en el estado aprobado desde cuándo lo está, y dejar de
      anunciar la espera de fecha cuando la inscripción ya se aprobó.
- [x] 3.4 Mostrar la entrevista anulada entre las cerradas del aspirante con su etiqueta propia, de
      modo que no se lea como una inasistencia suya.

## 4. Pruebas

- [x] 4.1 Probar en el guardián de transiciones que `approve` es legal desde los tres estados del
      tramo del decano e ilegal desde `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED` y `REJECTED`.
- [x] 4.2 Probar el service de aprobación: aprueba sin entrevista, aprueba con el pago pendiente,
      promueve el rol a STUDENT y deja la cita agendada como `CANCELLED`.
- [x] 4.3 Probar que una inscripción de otra facultad responde igual que una inexistente, y que ADMIN,
      APPLICANT y STUDENT siguen sin poder aprobar.
- [x] 4.4 Probar que la aprobación sigue siendo atómica: si falla, ni cambia el estado, ni el rol, ni
      se cierra la entrevista.
- [x] 4.5 Probar en el endpoint del decano la aprobación directa desde `PENDING_INTERVIEW`, y que el
      aspirante ve después su proceso aprobado sin que se le pida esperar fecha.

## 5. Cierre

- [x] 5.1 Corregir en `openspec/config.yaml` la línea de contexto que declara que aprobar exige el
      pago verificado, para que refleje que ese requisito es ahora de la entrega al decano.
- [x] 5.2 Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm test`, y dejar el árbol limpio.
