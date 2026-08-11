## Why

La plataforma sabe recibir inscripciones y no sabe qué hacer con ellas. Se acumulan enviadas, y
nadie tiene forma de mirarlas.

Eso deja tres cosas rotas al mismo tiempo. El rol STUDENT existe en el modelo y **es
inalcanzable**, porque solo se llega a él aprobando una inscripción. Quien olvida su contraseña
queda bloqueado sin ninguna salida. Y el aspirante que envió su inscripción se queda esperando
una respuesta que el sistema no puede darle.

Este change es la consola desde la que el administrador cierra ese ciclo: gestiona las cuentas,
revisa las inscripciones, verifica los pagos y decide. Es el último del alcance original.

## What Changes

- Se añade la **gestión de usuarios**: listado con paginación y búsqueda, alta, edición y
  eliminación lógica, incluida la creación de otros administradores.
- Se añade el **restablecimiento de contraseña** por parte del administrador, que es lo que
  desbloquea a quien la olvidó.
- Se añade la **bandeja de revisión** de inscripciones, con filtro por estado y por periodo.
- Se añade **tomar una inscripción para revisión**, que la deja a nombre de quien la tomó.
- Se añade **aprobar**, que en la misma operación **promueve al aspirante a STUDENT**, y
  **rechazar** con un motivo escrito obligatorio.
- Se añade la **verificación del pago** de un recibo, que es requisito para poder aprobar.
- Se añade la **administración de periodos académicos**: crear el del semestre siguiente,
  ajustar sus fechas y su tarifa, y desactivarlo. Hasta ahora se sembraban.
- El recibo pasa a **mostrarse como vencido** cuando pasa su fecha de pago.
- Se hace cumplir la protección de la cuenta de administrador original, que las specs exigen
  desde el primer change y que hasta ahora nadie podía violar porque no había por dónde
  intentarlo.

## Fuera de alcance

- **Notificar al aspirante.** No hay envío de correo en el MVP, así que se entera entrando a
  mirar. Es la carencia más visible de este change.
- **Anular inscripciones cuyo recibo venció.** El vencimiento se muestra y nada más: no hay
  proceso automático que cancele nada.
- **Editar los datos de la inscripción de un aspirante.** Si hay un error, se rechaza con el
  motivo y lo corrige quien lo declaró.
- **Obligar a cambiar la contraseña restablecida.** Ver Deuda.
- Administrar programas académicos, que se siguen sembrando.
- Cualquier informe, estadística o exportación.

## Capabilities

### New Capabilities

- `user-management`: administrar las cuentas de la plataforma —listar, crear, editar, eliminar
  y restablecer contraseñas— sin poder saltarse las reglas que protegen la cuenta de sistema ni
  otorgar un rol que solo se gana.
- `enrollment-review`: mirar las inscripciones enviadas, tomarlas, y decidir sobre ellas.

### Modified Capabilities

- `academic-catalog`: hasta ahora describía qué programas y periodos existen y cuándo se puede
  inscribir. Se le añade quién los administra y bajo qué reglas.
- `payment-receipt`: describía el recibo y decía que la verificación del pago es requisito para
  aprobar, sin decir quién la hace. Se le añade eso, y que el recibo señale cuándo venció.

## Impact

- **Roles**: ADMIN gana todo lo que puede hacer. APPLICANT gana la respuesta a su inscripción.
  **STUDENT deja de ser inalcanzable**: aprobar es lo único que lleva a ese rol.
- **Base de datos**: **ninguna migración.** El change anterior dejó ya las columnas que este
  necesita —quién revisó y cuándo, el motivo del rechazo, y quién verificó el pago—.
- **Configuración**: ninguna variable nueva.
- **Dependencias nuevas**: ninguna.
- **Arquitectura**: se amplían los cuatro módulos que ya existen en lugar de crear otros. Las
  transiciones de estado ya están declaradas desde el change anterior; este las invoca sin
  reescribir ninguna regla.
- **Frontend**: aparece la consola dentro del marco que ya existe, y las cuatro entradas del
  menú lateral del administrador dejan de estar marcadas como «pronto».

## Deuda que este change contrae a conciencia

- **El administrador conoce la contraseña que restablece.** La fija él y la comunica por fuera
  del sistema. Sin correo no hay alternativa razonable, y no hay forma de obligar a cambiarla
  después. Debería revisarse cuando exista envío de correo.
- **El aspirante no se entera de nada.** Ni de que le aprobaron ni de por qué le rechazaron,
  salvo que entre a mirar.

## Supuestos

- Un administrador ve las inscripciones de todos los aspirantes. Es la excepción a la regla de
  pertenencia, y ya está declarada en un único punto del sistema.
- Rechazar exige escribir un motivo: un rechazo sin explicación deja al aspirante sin saber qué
  corregir, y la spec de inscripción ya promete que verá ese motivo.
- Eliminar una cuenta no elimina su inscripción ni su recibo. Son documentos con valor
  probatorio, y por eso el borrado es lógico.
- Los listados no muestran las cuentas eliminadas salvo que se pidan explícitamente.
