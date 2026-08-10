## Why

Un aspirante puede crear cuenta y entrar, y lo que encuentra al llegar es una pantalla que le dice
que su inscripción estará disponible «pronto». Este change es esa inscripción: el motivo por el
que existe la plataforma.

Es también el primer change donde la autorización baja al nivel del dato. Hasta ahora bastaba con
saber qué rol tiene quien pide algo; aquí hay que saber además **de quién es** lo que pide. Un
aspirante que cambia un identificador en la barra de direcciones no puede acabar viendo la
inscripción de otro.

## What Changes

- Se añaden los **catálogos académicos**: los programas a los que se puede aspirar y los periodos
  de inscripción, con sus fechas de apertura y cierre y la tarifa del semestre.
- Se añade el **formulario de inscripción como wizard de cuatro pasos**, que guarda en cada paso.
  El aspirante puede salir y retomar sin perder nada.
- Se añade la **carga de documentos** —documento de identidad y resultados ICFES— directamente
  desde el navegador al almacenamiento externo, sin que el archivo pase por el backend.
- Se añade el **envío de la inscripción**, con las transiciones de estado y sus reglas.
- Se añade la **emisión del recibo de pago** al enviar, con su número consecutivo, su valor tomado
  del periodo y su fecha de vencimiento, descargable en PDF.
- Se añade la **corrección tras un rechazo**: el aspirante ve el motivo, corrige y reenvía.
- Se amplía el modelo de datos con inscripciones, documentos, recibos y los dos catálogos.

## Fuera de alcance

- **La revisión por parte del administrador.** Aprobar, rechazar y verificar el pago son del change
  siguiente. Aquí las transiciones que las representan quedan definidas y probadas, pero no hay
  ninguna pantalla desde la que dispararlas: se ejercitan desde las pruebas.
- **El CRUD de periodos académicos.** Aquí los periodos se siembran; el administrador los gestiona
  en el change 4.
- **La promoción a STUDENT.** Ocurre al aprobar, que es del change 4.
- **El pago en línea.** El recibo se genera para pagarlo por fuera; no hay pasarela.
- **Notificaciones por correo.** No hay envío de correo en el MVP, así que el aspirante se entera
  de un rechazo entrando a mirar.

## Capabilities

### New Capabilities

- `academic-catalog`: qué programas existen, qué periodo está abierto, y qué cuesta inscribirse en
  él.
- `enrollment-submission`: diligenciar la inscripción por pasos, enviarla, consultarla y
  corregirla tras un rechazo, con las reglas que gobiernan cada transición.
- `enrollment-documents`: adjuntar los documentos exigidos y sustituirlos, con el archivo viajando
  del navegador al almacenamiento sin pasar por el backend.
- `payment-receipt`: emitir el recibo al enviar la inscripción y ponerlo a disposición del
  aspirante.

### Modified Capabilities

- `access-control`: hasta ahora la autorización se resolvía por rol. Este change introduce el
  primer caso en que dos personas con el mismo rol no pueden ver lo mismo, así que el requisito
  que dice que el rol se toma de la sesión se amplía para cubrir también la pertenencia del dato.

## Impact

- **Roles**: APPLICANT gana todo lo que puede hacer. STUDENT ve su inscripción aprobada en solo
  lectura. ADMIN no gana pantallas aquí, pero sí las reglas que su consola usará en el change 4.
- **Base de datos**: cinco tablas nuevas —programas, periodos, inscripciones, documentos y
  recibos— con una restricción de unicidad que garantiza una sola inscripción por aspirante y
  periodo.
- **Infraestructura nueva**: un bucket de almacenamiento externo compatible con S3, y la
  configuración para firmar subidas contra él. El backend nunca recibe el archivo: solo autoriza
  que el navegador lo suba.
- **Dependencias nuevas**: el cliente de S3 y su firmador de URLs, y `pdfkit` para el recibo.
- **Despliegue**: aparece el tercer servicio externo, después de la base de datos y el frontend. El
  bucket necesita su propia configuración de CORS, independiente de la del API, porque el
  navegador le habla directamente.

## Deuda que este change contrae a conciencia

- **Sin historial de intentos.** Se guarda únicamente el motivo del último rechazo. Si un aspirante
  es rechazado tres veces, no queda rastro de los dos primeros motivos ni de quién los escribió.
  Es una decisión tomada a favor de la simplicidad; si más adelante hay un reclamo, no habrá con
  qué reconstruirlo.
- **Las credenciales del bucket viven en el entorno de desarrollo.** Al no usar un sustituto local,
  trabajar en la inscripción exige conexión y credenciales reales, y las pruebas que tocan la
  subida consumen cuota de la cuenta.

## Supuestos

- El aspirante elige programa y periodo en el paso de aspiración, y a partir de ese momento su
  inscripción pertenece a ese periodo. Cambiar de periodo significa empezar una inscripción nueva.
- Solo se puede iniciar una inscripción mientras el periodo esté abierto. Una inscripción ya
  empezada puede terminarse y enviarse hasta la fecha de cierre.
- El recibo se emite en el momento del envío, con el valor vigente del periodo en ese instante.
  Cambiar la tarifa después no altera los recibos ya emitidos.
- Los documentos se pueden sustituir mientras la inscripción sea editable, y quedan congelados al
  enviarla.
