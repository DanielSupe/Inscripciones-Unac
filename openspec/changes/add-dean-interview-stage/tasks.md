## 1. Contratos y modelo de datos

- [ ] 1.1 Añadir a `packages/contracts` el rol `DEAN`, los tres estados nuevos de inscripción y
      los enums de la entrevista, con sus etiquetas en español.
- [ ] 1.2 Esquemas Zod de la entrevista: agendar y mover —con la regla de que presencial exige
      lugar y virtual exige enlace— y declarar el resultado.
- [ ] 1.3 DTO de facultad y su decano, y el DTO de programa ampliado con su facultad.
- [ ] 1.4 DTO de la inscripción ampliado con la entrevista vigente, el historial de cerradas y
      quién decidió.
- [ ] 1.5 Migración de Prisma: modelo `Faculty`, `Interview`, los enums, `decidedByUserId` y
      `decidedAt` en `Enrollment`, y `AcademicProgram.facultyId` **obligatorio** con el relleno
      de los programas ya sembrados dentro de la misma migración.
- [ ] 1.6 Comprobar la migración contra una base de datos que ya tenga los ocho programas
      sembrados, y verificar que ninguno queda sin facultad.

## 2. Configuración y semilla

- [ ] 2.1 Declarar `SEED_DEAN_EMAIL_DOMAIN` y `SEED_DEAN_PASSWORD` en el esquema Zod de
      `packages/config`, requeridas para sembrar.
- [ ] 2.2 Añadirlas al `.env.example` de `apps/api` con valor de ejemplo y un comentario de una
      línea.
- [ ] 2.3 Sembrar las facultades propuestas, asignar cada programa a la suya y crear su decano
      con rol `DEAN`. Idempotente: repetir la siembra no duplica nada ni pisa una contraseña ya
      cambiada. Dejar el reparto marcado en el archivo como pendiente de confirmar.

## 3. Backend — transiciones y catálogo

- [ ] 3.1 Ampliar `enrollment.transitions.ts` con `handOver`, `schedule`, `markHeld` y
      `markNoShow`; mover el origen de `approve` a `INTERVIEW_HELD` y dar a `reject` sus dos
      orígenes. Sigue siendo puro.
- [ ] 3.2 Declarar en esa misma tabla qué rol puede disparar cada acción.
- [ ] 3.3 Pruebas del guardián de transiciones, incluidos los caminos imposibles: aprobar sin
      entrevista, agendar antes de la entrega, entregar dos veces.
- [ ] 3.4 Repositorio y servicio de facultades en el módulo de catálogo, incluida la resolución
      del decano a partir de un programa.

## 4. Backend — entrega y decisión

- [ ] 4.1 Servicio: entregar al decano, comprobando documentos completos, pago verificado y que
      la facultad del programa tenga decano. El destino se deriva; no se acepta del cliente.
- [ ] 4.2 Servicio: aprobar pasa al rol `DEAN`, exige entrevista realizada y conserva la
      promoción a `STUDENT` dentro de la misma transacción.
- [ ] 4.3 Servicio: rechazar admite al `ADMIN` en revisión y al `DEAN` tras la entrevista o tras
      una inasistencia, siempre con motivo.
- [ ] 4.4 Alcance del decano en el repositorio de inscripciones: la facultad entra en la cláusula
      de la consulta, de modo que una inscripción ajena se lee como ausente.
- [ ] 4.5 Bandeja del decano: listado paginado, filtrado por su facultad y por lo ya entregado.
- [ ] 4.6 Rutas y controladores de entrega, aprobación, rechazo y bandeja, cada uno declarando
      sus roles.

## 5. Backend — entrevista

- [ ] 5.1 Módulo `interview` con sus capas: agendar, mover, declarar realizada y declarar
      inasistencia.
- [ ] 5.2 Invariante de una sola entrevista vigente por inscripción, comprobada al crearla.
- [ ] 5.3 Rechazar fechas en el pasado al agendar, y rechazar declarar realizada una cita cuya
      fecha aún no llegó.
- [ ] 5.4 La inasistencia cierra la entrevista y devuelve la inscripción a la espera, dejando el
      historial intacto.
- [ ] 5.5 Exponer la entrevista vigente y el historial en el detalle de la inscripción, con el
      alcance de cada rol.

## 6. Frontend — zona del decano

- [ ] 6.1 Rol `DEAN` en la navegación y en el router, con su zona propia resuelta en el guard.
- [ ] 6.2 Bandeja del decano con su tabla, filtros y la fecha de entrevista.
- [ ] 6.3 Detalle de la inscripción para el decano: datos declarados, documentos con el visor ya
      existente, y el recibo.
- [ ] 6.4 Modal de agendar y reagendar, con la modalidad cambiando qué dato se pide.
- [ ] 6.5 Acciones de declarar realizada y declarar inasistencia, con el historial visible.
- [ ] 6.6 Aprobar y rechazar desde el detalle, con el rechazo exigiendo motivo.

## 7. Frontend — administración y aspirante

- [ ] 7.1 Quitar el botón de aprobar de la consola del ADMIN y poner el de entregar, con sus
      condiciones explicadas cuando no se pueda.
- [ ] 7.2 Mostrar al ADMIN la entrevista y la decisión en solo lectura, y la facultad en la
      bandeja.
- [ ] 7.3 Explicar en el proceso del aspirante los tres estados nuevos, sin dejar ninguno sin
      texto.
- [ ] 7.4 Ficha de la entrevista para el aspirante: día, hora en la hora de Colombia y cómo
      asistir, con el enlace abrible si es virtual.

## 8. Pruebas

- [ ] 8.1 Servicio de entrega: con todo conforme, con el pago pendiente, con documentos
      incompletos, y con la facultad sin decano.
- [ ] 8.2 Servicio de aprobación: que solo el `DEAN` aprueba, que exige entrevista realizada, y
      que la promoción a `STUDENT` sigue siendo atómica.
- [ ] 8.3 Alcance del decano: que una inscripción de otra facultad responde **igual** que una
      inexistente, comparando las dos respuestas.
- [ ] 8.4 Servicio de entrevista: agendar, mover, no poder mover una cerrada, y la inasistencia
      devolviendo la inscripción a la espera con su historial.
- [ ] 8.5 Endpoints cuyos permisos cambian: que el `ADMIN` ya no puede aprobar y que el `DEAN` no
      puede gestionar cuentas, periodos ni pagos.
- [ ] 8.6 Semilla: idempotente, y que falla ruidosamente sin sus variables de entorno.
- [ ] 8.7 Frontend: que el aspirante ve un texto para cada estado nuevo y la ficha de su
      entrevista.

## 9. Cierre

- [ ] 9.1 Recorrer el proceso completo a mano: aspirante envía, admin verifica y entrega, decano
      agenda, marca realizada y aprueba, y el aspirante entra como estudiante.
- [ ] 9.2 Recorrer también el camino de la inasistencia y el del rechazo por trámite.
- [ ] 9.3 `pnpm lint`, `pnpm typecheck` y `pnpm test` en verde.
