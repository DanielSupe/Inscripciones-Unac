## 1. Contratos y modelo de datos

- [x] 1.1 Añadir a `packages/contracts` el rol `DEAN`, los tres estados nuevos de inscripción y
      los enums de la entrevista, con sus etiquetas en español.
- [x] 1.2 Esquemas Zod de la entrevista: agendar y mover —con la regla de que presencial exige
      lugar y virtual exige enlace— y declarar el resultado.
- [x] 1.3 DTO de facultad y su decano, y el DTO de programa ampliado con su facultad.
- [x] 1.4 DTO de la inscripción ampliado con la entrevista vigente, el historial de cerradas y
      quién decidió.
- [x] 1.5 Migración de Prisma: modelo `Faculty`, `Interview`, los enums, `decidedByUserId` y
      `decidedAt` en `Enrollment`, y `AcademicProgram.facultyId` **obligatorio** con el relleno
      de los programas ya sembrados dentro de la misma migración.
- [x] 1.6 Comprobar la migración contra una base de datos que ya tenga los ocho programas
      sembrados, y verificar que ninguno queda sin facultad.

## 2. Configuración y semilla

- [x] 2.1 Declarar `SEED_DEAN_EMAIL_DOMAIN` y `SEED_DEAN_PASSWORD` en el esquema Zod de
      `packages/config`, requeridas para sembrar.
- [x] 2.2 Añadirlas al `.env.example` de `apps/api` con valor de ejemplo y un comentario de una
      línea.
- [x] 2.3 Sembrar las facultades propuestas, asignar cada programa a la suya y crear su decano
      con rol `DEAN`. Idempotente: repetir la siembra no duplica nada ni pisa una contraseña ya
      cambiada. Dejar el reparto marcado en el archivo como pendiente de confirmar.

## 3. Backend — transiciones y catálogo

- [x] 3.1 Ampliar `enrollment.transitions.ts` con `handOver`, `schedule`, `markHeld` y
      `markNoShow`; mover el origen de `approve` a `INTERVIEW_HELD` y dar a `reject` sus dos
      orígenes. Sigue siendo puro.
- [x] 3.2 Declarar en esa misma tabla qué rol puede disparar cada acción.
- [x] 3.3 Pruebas del guardián de transiciones, incluidos los caminos imposibles: aprobar sin
      entrevista, agendar antes de la entrega, entregar dos veces.
- [x] 3.4 Repositorio y servicio de facultades en el módulo de catálogo, incluida la resolución
      del decano a partir de un programa.

## 4. Backend — entrega y decisión

- [x] 4.1 Servicio: entregar al decano, comprobando documentos completos, pago verificado y que
      la facultad del programa tenga decano. El destino se deriva; no se acepta del cliente.
- [x] 4.2 Servicio: aprobar pasa al rol `DEAN`, exige entrevista realizada y conserva la
      promoción a `STUDENT` dentro de la misma transacción.
- [x] 4.3 Servicio: rechazar admite al `ADMIN` en revisión y al `DEAN` tras la entrevista o tras
      una inasistencia, siempre con motivo.
- [x] 4.4 Alcance del decano en el repositorio de inscripciones: la facultad entra en la cláusula
      de la consulta, de modo que una inscripción ajena se lee como ausente.
- [x] 4.5 Bandeja del decano: listado paginado, filtrado por su facultad y por lo ya entregado.
- [x] 4.6 Rutas y controladores de entrega, aprobación, rechazo y bandeja, cada uno declarando
      sus roles.

## 5. Backend — entrevista

- [x] 5.1 Módulo `interview` con sus capas: agendar, mover, declarar realizada y declarar
      inasistencia.
- [x] 5.2 Invariante de una sola entrevista vigente por inscripción, comprobada al crearla.
- [x] 5.3 Rechazar fechas en el pasado al agendar, y rechazar declarar realizada una cita cuya
      fecha aún no llegó.
- [x] 5.4 La inasistencia cierra la entrevista y devuelve la inscripción a la espera, dejando el
      historial intacto.
- [x] 5.5 Exponer la entrevista vigente y el historial en el detalle de la inscripción, con el
      alcance de cada rol.

## 6. Frontend — zona del decano

- [x] 6.1 Rol `DEAN` en la navegación y en el router, con su zona propia resuelta en el guard.
- [x] 6.2 Bandeja del decano con su tabla, filtros y la fecha de entrevista.
- [x] 6.3 Detalle de la inscripción para el decano: datos declarados, documentos con el visor ya
      existente, y el recibo.
- [x] 6.4 Modal de agendar y reagendar, con la modalidad cambiando qué dato se pide.
- [x] 6.5 Acciones de declarar realizada y declarar inasistencia, con el historial visible.
- [x] 6.6 Aprobar y rechazar desde el detalle, con el rechazo exigiendo motivo.

## 7. Frontend — administración y aspirante

- [x] 7.1 Quitar el botón de aprobar de la consola del ADMIN y poner el de entregar, con sus
      condiciones explicadas cuando no se pueda.
- [x] 7.2 Mostrar al ADMIN la entrevista y la decisión en solo lectura, y la facultad en la
      bandeja.
- [x] 7.3 Explicar en el proceso del aspirante los tres estados nuevos, sin dejar ninguno sin
      texto.
- [x] 7.4 Ficha de la entrevista para el aspirante: día, hora en la hora de Colombia y cómo
      asistir, con el enlace abrible si es virtual.

## 8. Pruebas

- [x] 8.1 Servicio de entrega: con todo conforme, con el pago pendiente, con documentos
      incompletos, y con la facultad sin decano.
- [x] 8.2 Servicio de aprobación: que solo el `DEAN` aprueba, que exige entrevista realizada, y
      que la promoción a `STUDENT` sigue siendo atómica.
- [x] 8.3 Alcance del decano: que una inscripción de otra facultad responde **igual** que una
      inexistente, comparando las dos respuestas.
- [x] 8.4 Servicio de entrevista: agendar, mover, no poder mover una cerrada, y la inasistencia
      devolviendo la inscripción a la espera con su historial.
- [x] 8.5 Endpoints cuyos permisos cambian: que el `ADMIN` ya no puede aprobar y que el `DEAN` no
      puede gestionar cuentas, periodos ni pagos.
- [x] 8.6 Semilla: idempotente, y que falla ruidosamente sin sus variables de entorno.
- [x] 8.7 Frontend: que el aspirante ve un texto para cada estado nuevo y la ficha de su
      entrevista.

## 9. Cierre

- [x] 9.1 Recorrer el proceso completo a mano: aspirante envía, admin verifica y entrega, decano
      agenda, marca realizada y aprueba, y el aspirante entra como estudiante.
- [x] 9.2 Recorrer también el camino de la inasistencia y el del rechazo por trámite.
- [x] 9.3 `pnpm lint`, `pnpm typecheck` y `pnpm test` en verde.

## 10. No previsto, salido de verificar

- [x] 10.1 **Defecto anterior a este change.** La migración `simplify_enrollment_add_diploma`
      usaba el tipo `AttachmentType` que crea una migración posterior, así que el historial no se
      podía reproducir desde cero: una base de datos nueva —es decir, cualquier despliegue—
      fallaba ahí. Solo se vio al reconstruir el esquema de pruebas. Se renombró para que ordene
      después de su dependencia y se realineó la base de desarrollo.
- [x] 10.2 Reescribir el bloque de decisión de `admin.integration.test.ts`: probaba que el
      administrador aprueba, que es justo lo que este change le quita.
- [x] 10.3 Dar decano a la facultad de prueba del administrador; sin él la entrega se rechaza,
      que es el comportamiento correcto.
- [x] 10.4 Completar el fixture de siembra en `packages/config` con las dos variables nuevas.
- [x] 10.5 El detalle del decano ofrecía «Agendar entrevista» con la entrevista ya realizada, y
      ese botón habría dado 409. Se vio recorriendo la pantalla, no en las pruebas. Ahora solo
      aparece a la espera de fecha, y dice «Citar de nuevo» tras una inasistencia.
- [x] 10.6 La etiqueta del motivo del rechazo se pintaba al lado de su área de texto, no encima.
      Venía de la consola del administrador; se corrige en las dos pantallas.
