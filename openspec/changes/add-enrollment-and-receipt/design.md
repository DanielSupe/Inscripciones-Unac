## Context

Ver `proposal.md` — Why para la motivación y `specs/` para los requisitos.

Los dos changes anteriores dejaron la plantilla de módulos, la sesión y la autorización por rol.
Este es el primero que introduce reglas de negocio de verdad, y con ellas tres cosas que el
proyecto todavía no había tenido que resolver:

1. **Autorización sobre el dato, no solo sobre el rol.** Dos aspirantes tienen idéntico rol y no
   pueden ver lo mismo.
2. **Un servicio externo al que el navegador le habla directamente**, con su propia configuración
   de CORS, independiente de la del API.
3. **Una máquina de estados** que gobierna qué se puede hacer y cuándo.

Restricción que sigue mandando: el backend no tiene disco persistente y corre en un plan gratuito.
Ningún archivo puede atravesarlo.

## Goals / Non-Goals

**Goals:**

- Que sea imposible ver el dato de otro aunque se adivine el identificador, y que eso esté
  garantizado por dónde vive la comprobación, no por qué botones muestra la interfaz.
- Que la máquina de estados tenga un único punto de decisión, para que el change 4 solo tenga que
  llamarlo y no reimplementar las reglas.
- Que el archivo nunca toque el backend, ni siquiera de paso.

**Non-Goals:**

- No se construye un motor de formularios genérico. Cuatro pasos conocidos no justifican la
  abstracción.
- No se optimiza la generación del PDF ni se cachea. Se emite pocas veces y pesa poco.

## Decisions

### La pertenencia se comprueba en el service, junto a la regla de negocio

`requireRole` sigue siendo transporte: decide quién puede llamar. La pertenencia es otra cosa —
depende del dato— y vive en el service, que es quien puede consultarlo.

La forma concreta: el service **nunca** recibe solo el identificador del recurso. Recibe siempre
el identificador y la sesión, y resuelve contra los dos a la vez.

```
✗ enrollmentService.findById(enrollmentId)
✓ enrollmentService.findOwnedBy(enrollmentId, session)
```

No es cosmético. Con la primera firma, olvidar la comprobación es un descuido silencioso; con la
segunda, no hay forma de escribir la llamada sin pasar la sesión. La consulta filtra por dueño en
la misma cláusula, así que un recurso ajeno devuelve «no existe» sin que haya que acordarse de
comparar nada después.

Un ADMIN pasa el mismo camino, con la excepción explícita de que su rol le da acceso a cualquiera.
Esa excepción se declara en un solo sitio.

Alternativa descartada: un middleware genérico de pertenencia. Tendría que conocer todos los tipos
de recurso y sus reglas, que es exactamente la lógica de negocio que se supone que no vive ahí.

### Las transiciones tienen un único guardián

Un módulo de dominio declara qué transiciones existen y qué exige cada una. El service las
consulta; nadie más decide.

```
DRAFT ──enviar──▶ SUBMITTED ──tomar──▶ UNDER_REVIEW ──┬─aprobar─▶ APPROVED
  ▲                                                   └─rechazar─▶ REJECTED
  └──────────────── corregir ─────────────────────────────────────────┘
```

Cada transición declara sus condiciones: enviar exige datos y documentos completos y periodo
abierto; aprobar exige pago verificado; corregir solo se puede desde rechazada. El change 4
llamará a `aprobar` y `rechazar` sin volver a escribir ninguna de esas reglas.

El estado no aparece en ningún esquema de entrada, así que no hay forma de escribirlo desde una
petición.

### La subida: el backend firma, el navegador sube

```
navegador ──1. «voy a subir X, de tipo T, de N bytes» ──▶ API
                                                          │ valida tipo y tamaño
                                                          │ compone la clave
                                                          │ firma un permiso temporal
     ◀──────────── 2. permiso firmado ────────────────────┘
     │
     └──3. PUT del archivo ──▶ almacenamiento
     │
     └──4. «ya subí» ──▶ API ──▶ registra el documento
```

La validación de tipo y tamaño ocurre en el paso 1, **antes** de firmar: el permiso se emite ya
restringido, de modo que no sirve para subir otra cosa. La clave del objeto la compone el servidor
a partir de la inscripción y el tipo de documento; el cliente no la propone, porque proponerla
sería poder escribir donde no le toca.

El paso 4 es necesario porque el almacenamiento no le cuenta al API que la subida terminó. Es
también donde se detecta una subida abandonada: si nunca llega, el documento no consta.

Alternativa descartada: que el archivo pase por el API. Lo prohíbe la ausencia de disco y el
límite de payload del plan gratuito, y con varios aspirantes subiendo a la vez tumbaría la
instancia.

### Los documentos se leen también con permisos temporales

Nunca se hace público el almacenamiento. Para ver un documento, el API comprueba la pertenencia y
firma un permiso de lectura de vida corta. La dirección resultante caduca, que es lo que exige la
spec de que no sea permanente.

### El recibo: `pdfkit`, no un navegador sin cabeza

`pdfkit` obliga a maquetar el recibo a mano, coordenada por coordenada. A cambio pesa poco y corre
en cualquier instancia. Un navegador sin cabeza produciría mejor maquetación a partir de HTML,
pero pesa cientos de megas y no cabe en el plan donde va a correr esto.

El PDF se genera al vuelo en cada descarga, no se guarda. Los datos que lo componen ya están en la
base de datos, así que guardarlo sería una copia más que mantener sincronizada para ahorrar unos
milisegundos.

### El número de recibo

Un consecutivo por periodo, con el código del periodo como prefijo: `2026-1-000042`. Legible para
quien lo recibe en el banco, y ordenable. Lo genera la base de datos con una secuencia, no la
aplicación, porque dos envíos simultáneos con un contador en memoria producirían el mismo número.

### Modelo de datos

```
AcademicProgram   id, code, name, isActive                            ← seed
AcademicPeriod    id, code, opensAt, closesAt,
                  enrollmentFeeAmount, currency, isActive             ← seed (CRUD: change 4)

Enrollment        id, userId, programId, periodId, status,
                  firstName, lastName, birthDate, sex, phone,
                  city, department,
                  previousSchool, graduationYear,
                  icfesRegistration, icfesScore,
                  shift, modality,
                  submittedAt?, reviewedAt?, reviewedByUserId?,
                  rejectionReason?
                  @@unique([userId, periodId])

EnrollmentDocument id, enrollmentId, type, storageKey,
                   contentType, sizeBytes, uploadedAt
                   @@unique([enrollmentId, type])

PaymentReceipt     id, enrollmentId (único), receiptNumber (único),
                   amount, currency, issuedAt, dueAt,
                   status, verifiedAt?, verifiedByUserId?
```

Casi todos los campos de `Enrollment` son nulables, y no por descuido: el wizard guarda en cada
paso, así que una inscripción en borrador está incompleta por definición. Lo que exige que estén
llenos es la transición de envío, no la columna. Poner `NOT NULL` obligaría a inventar valores
vacíos para poder guardar un paso.

`@@unique([enrollmentId, type])` es lo que hace que sustituir un documento reemplace en vez de
acumular.

El valor del recibo se copia del periodo al emitirlo, en lugar de leerse por relación. Es
duplicación deliberada: un recibo es un documento con valor probatorio y no puede cambiar porque
alguien edite una tarifa.

### Módulos

```
modules/catalog/       programas y periodos; qué está abierto
modules/enrollment/    el wizard, las transiciones, la pertenencia
modules/documents/     permisos de subida y lectura, registro de adjuntos
modules/receipt/       emisión, consulta y PDF
shared/storage/        cliente de S3 y firmador; único que habla con el bucket
```

`enrollment` es el que orquesta: al enviar, pide a `catalog` que el periodo esté abierto, a
`documents` que estén los dos adjuntos, y a `receipt` que emita. Siempre por services.

## Variables de entorno

| Variable | Ejemplo | Nota |
|---|---|---|
| `S3_REGION` | `us-east-1` | Región del bucket |
| `S3_BUCKET` | `sion-unac-documentos` | Nombre del bucket |
| `S3_ACCESS_KEY_ID` | `AKIA…` | Credencial del usuario de servicio |
| `S3_SECRET_ACCESS_KEY` | *(secreto)* | Nunca se imprime |
| `S3_ENDPOINT` | *(vacío en AWS)* | Solo se fija con almacenamiento compatible |
| `S3_FORCE_PATH_STYLE` | `false` | `true` con almacenamiento compatible |
| `S3_PRESIGN_EXPIRES_SECONDS` | `300` | Vida del permiso de subida y de lectura |
| `MAX_UPLOAD_BYTES` | `5242880` | 5 MB por archivo |
| `RECEIPT_DUE_DAYS` | `15` | Días hasta el vencimiento del recibo |

## Impacto en el despliegue

- **El bucket necesita su propia configuración de CORS.** El navegador le habla directamente, así
  que el `CORS_ORIGIN` del API no le sirve de nada. Es el error más probable de este change: la
  firma funciona, la subida falla, y el mensaje del navegador no dice que el problema esté en el
  bucket.
- **El bucket debe estar cerrado al público.** Todo acceso pasa por un permiso firmado. Un bucket
  público expondría documentos de identidad.
- **Las credenciales del bucket son un secreto más**, con el mismo tratamiento que el de la sesión:
  variable de entorno requerida, nunca en el código, nunca impresa.
- El usuario de servicio debe poder escribir, leer y borrar **solo en este bucket**. Una credencial
  con más permisos de los necesarios convierte una filtración en un problema mayor.

## Risks / Trade-offs

- **La configuración de CORS del bucket solo se prueba desde un navegador.** Las pruebas del API
  firman permisos correctamente aunque el bucket los rechace después. → Una comprobación manual
  desde el navegador es parte del cierre del change, y el fallo típico queda documentado.
- **Sin historial de intentos** (decisión del proposal). → El motivo del último rechazo se
  conserva; los anteriores se pierden. Añadir la tabla después es una migración sencilla, pero los
  datos de antes no se recuperan.
- **Sin sustituto local del almacenamiento** (decisión del proposal). → Desarrollar la subida exige
  conexión y credenciales. Las pruebas automatizadas de la subida usan un doble en vez de tocar la
  nube, así que `pnpm test` sigue corriendo sin red.
- **Documentos huérfanos.** Si el navegador sube el archivo y nunca confirma, queda un objeto en el
  bucket que nadie referencia. → Se acepta; una regla de expiración en el bucket los recoge sin que
  la aplicación tenga que hacer nada.
- **Este change es grande.** Cuatro capacidades nuevas y una modificada. → El punto natural de
  corte, si hiciera falta partirlo, es entre la inscripción y el recibo: el recibo solo depende del
  envío, y todo lo anterior tiene sentido sin él.

## Migration Plan

Cinco tablas nuevas y ninguna modificación destructiva sobre las existentes. El seed se amplía con
los programas académicos y un periodo abierto, manteniendo la idempotencia que ya tenía. Las
cuentas creadas antes de este change siguen siendo válidas y simplemente no tienen inscripción.
