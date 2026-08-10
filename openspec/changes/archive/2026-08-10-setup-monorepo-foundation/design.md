## Context

El repositorio está vacío: no hay código, ni dependencias, ni base de datos. Ver
`proposal.md` — Why para la motivación, y `specs/` para los requisitos observables.

Tres restricciones dan forma a todo lo que sigue:

1. El frontend y el backend se desplegarán en dominios distintos (Vercel y un host de tier
   gratuito), lo que obliga a resolver CORS y origen exacto desde el principio.
2. El host del backend no tendrá disco persistente ni tolerará procesos pesados.
3. Vite resuelve sus variables en tiempo de construcción, mientras que el backend las resuelve
   en tiempo de arranque. Un mecanismo único de configuración tiene que convivir con esa
   diferencia sin esconderla.

## Goals / Non-Goals

**Goals:**

- Fijar la estructura de carpetas y la convención de módulos que van a copiar los tres changes
  siguientes, dejando un módulo real que sirva de plantilla.
- Que el mecanismo de configuración sea la única puerta de entrada del entorno, y que sea
  igual de estricto en el backend y en el frontend pese a resolverse en momentos distintos.
- Demostrar la cadena completa navegador → API → ORM → Postgres con la menor superficie
  posible, para que un fallo de infraestructura se distinga de un fallo de negocio.

**Non-Goals:**

- No se define ninguna abstracción de autorización, ni middleware de sesión, ni contrato de
  autenticación. Se añaden en el change de cuentas, cuando haya un caso real que los guíe.
- No se generaliza el manejo de errores más allá de lo que usa el módulo `health`.
- No se optimiza el arranque, el tamaño del bundle ni la caché de Turborepo.

## Decisions

### pnpm + Turborepo

pnpm sobre npm workspaces por el enlazado estricto: un paquete no puede importar una
dependencia que no declaró, lo que impide que `apps/web` acabe usando por accidente algo que
solo instaló `apps/api`. En un monorepo con front y back compartiendo `packages/contracts`,
esa disciplina es justamente lo que protege el límite.

Alternativa descartada: npm workspaces, más simple de instalar pero con hoisting plano, que
deja pasar importaciones no declaradas hasta que fallan en el despliegue.

### TypeScript fijado a 5.9.3 en todo el repo

`typescript-eslint@8` declara el peer `typescript >=4.8.4 <6.1.0`. Instalar sin restricción
resuelve TypeScript 7 —el port nativo— y entonces **el lint falla en seco** aunque el
typecheck funcione, con el mensaje `typescript-eslint does not support TS 7.0`.

Se fija la versión con un `overrides` en `pnpm-workspace.yaml`, no en `package.json`: pnpm 10
movió ahí esa clave y en la raíz se ignora en silencio, que es peor que fallar.

Es una restricción del herramental, no una preferencia: se revisará cuando typescript-eslint
publique soporte para TS 7.

### Prisma 7: la conexión sale del esquema

Prisma 7 dejó de admitir `url` dentro del bloque `datasource`. La cadena de conexión vive
ahora en `apps/api/prisma.config.ts`, que consume la CLI (`migrate`, `studio`), y el cliente
de la aplicación necesita además un **adaptador de driver**:

```
prisma.config.ts   ── datasource.url ──▶  CLI de Prisma (migrate, studio)
shared/database/   ── PrismaPg(env.DATABASE_URL) ──▶  PrismaClient({ adapter })
```

Esto añade tres dependencias que no estaban previstas: `@prisma/adapter-pg`, `pg` y `dotenv`
—Prisma 7 tampoco carga `.env` por su cuenta, así que `prisma.config.ts` lo hace explícito—.

Encaja bien con la regla de no hardcodear: la conexión pasa a ser un valor que se inyecta,
no una cadena que el esquema resuelve por su cuenta.

### Los paquetes compartidos se consumen como TypeScript fuente

`packages/*` no se compilan: exportan directamente sus archivos `.ts`. Eso evita un paso de
build entre paquetes, pero obliga a que quien los consuma sepa procesarlos:

- **`apps/api`** usa `tsx` en desarrollo y **`tsup`** para el build, con `noExternal: [/^@repo\//]`
  para que los paquetes queden empaquetados dentro del `dist`. Sin eso, el `dist` importaría
  archivos `.ts` que Node no sabe ejecutar.
- **`apps/web`** funciona sin más para el código de la aplicación, pero **al cargar
  `vite.config.ts`** Vite externaliza los paquetes de `node_modules` y Node falla al resolver
  sus imports sin extensión. Se resuelve con `vite --configLoader runner`, que hace que Vite
  procese también las dependencias del archivo de configuración.

Alternativa descartada: compilar cada paquete a `dist` antes de usarlo. Es más ortodoxo, pero
mete un paso de build en el bucle de desarrollo a cambio de nada en un repo de este tamaño.

### `packages/config` con tres entradas, no una

El backend lee `process.env` en el arranque; el navegador no tiene `process.env` en absoluto y
Vite sustituye `import.meta.env.VITE_*` como texto durante la construcción. Forzar una sola
entrada obligaría a un adaptador que oculta esa diferencia y que falla de formas confusas.

El paquete expone tres entradas:

- `@repo/config/server` — parsea `process.env` al importarse. Si el esquema no valida, imprime
  **todos** los problemas juntos y termina el proceso con código 1. Se importa una sola vez,
  lo más arriba posible del arranque del API.
- `@repo/config/seed` — el mismo mecanismo, pero con el esquema de la siembra. Va aparte
  porque el servidor en producción no debe necesitar `SEED_ADMIN_PASSWORD` para arrancar:
  exigírselo obligaría a que ese secreto viva en el entorno del servicio web pudiendo vivir
  solo donde se ejecuta la siembra.
- `@repo/config/web` — exporta el esquema Zod del frontend y la función que lo aplica, sin
  parsear nada por sí mismo.

El frontend lo usa en dos momentos, con el mismo esquema:

- En `apps/web/vite.config.ts`, con `loadEnv`, para que **la construcción falle** si falta una
  variable. Este es el control que de verdad importa, porque es el que corre en Vercel.
- En `apps/web/src/lib/config.ts`, sobre `import.meta.env`, para obtener el objeto validado y
  tipado que consume la aplicación.

Alternativa descartada: leer `import.meta.env` directamente en los componentes. Es lo que hace
que un despliegue arranque y falle recién cuando alguien navega a la pantalla equivocada.

### Fallo ruidoso con todos los errores juntos

La validación usa `safeParse` y formatea la lista completa de problemas antes de terminar. Con
`parse` a secas, Zod lanza en el primer fallo y configurar un servidor nuevo se convierte en
arrancar, corregir una variable, arrancar de nuevo. El mensaje nombra cada variable y el
formato esperado, y nunca imprime valores, para no volcar un secreto en los registros del
host.

### El módulo `health` como plantilla de capas

`health` es trivial como funcionalidad y por eso es un buen molde. Se implementa completo,
respetando la separación que exige [CLAUDE.md](../../../CLAUDE.md):

```
apps/api/src/modules/health/
  health.routes.ts       monta GET /health
  health.controller.ts   llama al service y elige 200 u 503
  health.service.ts      decide si el sistema está sano; sin req/res
  health.repository.ts   ejecuta SELECT 1 contra Postgres; único que toca Prisma
```

La comprobación de base de datos se envuelve en una carrera contra un temporizador tomado de
configuración, para cumplir el requisito de que la consulta no se quede colgada cuando el host
de la base de datos no responde ni rechaza.

El controller devuelve 503 cuando el service reporta degradación. Se elige 503 y no 200 con un
campo `status` porque los supervisores externos de los hosts gratuitos actúan sobre el código
HTTP, no sobre el cuerpo.

### Errores de dominio y una sola forma de respuesta

Se crean las clases `NotFoundError`, `ConflictError`, `ForbiddenError` y `ValidationError` en
`apps/api/src/shared/errors/`, y un middleware final que las traduce a códigos HTTP. La forma
del cuerpo de error se declara en `packages/contracts` para que el cliente HTTP del frontend
la tipe sin duplicarla:

```
{ error: { code: string, message: string, details?: unknown } }
```

Cualquier error no reconocido se registra íntegro en el servidor y se responde como 500 con un
mensaje genérico. Nada de trazas ni de mensajes crudos del ORM hacia el cliente.

Este change solo ejercita el camino de 500 y el de 503; las clases se crean igualmente porque
el módulo siguiente las necesita y definirlas ahora evita que cada módulo invente las suyas.

### Modelo de datos

Solo `User`, con la identidad completa que el proyecto ya tiene decidida:

```
User
  id                String   @id @default(cuid())
  documentType      DocumentType
  documentNumber    String
  email             String   @unique
  passwordHash      String
  role              Role     @default(APPLICANT)
  isSystem          Boolean  @default(false)
  emailVerifiedAt   DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?

  @@unique([documentType, documentNumber])

enum Role         { APPLICANT STUDENT ADMIN }
enum DocumentType { CC TI CE PA PEP }
```

Tres campos no se usan en este change y aun así entran ahora:

- `emailVerifiedAt` — el MVP no verifica correo, pero la decisión de dejar la puerta abierta ya
  está tomada, y añadir la columna después obligaría a una migración por una funcionalidad que
  seguirá sin existir.
- `deletedAt` — el borrado lógico es una regla del proyecto, no del change que lo estrene. Que
  la columna exista desde el principio impide que alguien escriba un `delete` real.
- `isSystem` — marca la cuenta de administrador original como indestructible, tal como exige
  `specs/initial-admin-account`. Es la única forma de que ese requisito sea verificable en los
  datos antes de que exista la consola de administración que debe respetarlo.

Los campos de aceptación de políticas **no** entran aquí: pertenecen al registro, y su
variable `POLICY_VERSION` llegaría sin nada que la use, contra la regla de introducir cada
variable junto a su uso.

La unicidad se garantiza con índices únicos en base de datos, no solo con validación en el
service. `@@unique([documentType, documentNumber])` y `email` único.

### Seed idempotente por documento

`prisma/seed.ts` identifica al administrador original por `(documentType, documentNumber)` y
hace `upsert` sobre esa clave, actualizando correo y contraseña. Así, cambiar el correo o la
contraseña en el entorno y volver a sembrar reconcilia la cuenta existente en vez de crear
otra.

Antes del `upsert` comprueba si ya existe alguna cuenta con `isSystem: true` cuyo documento
sea distinto al de la configuración. Si la hay, aborta con un mensaje que explica el conflicto,
porque continuar dejaría dos administradores de sistema y rompería el requisito de que haya
exactamente uno.

Alternativa descartada: identificar por correo. El correo es el dato que más cambia; usarlo
como identidad convierte cada corrección de correo en un administrador nuevo.

### bcrypt sobre argon2

`bcrypt` por pragmatismo de despliegue: `argon2` es criptográficamente preferible, pero su
compilación nativa da más problemas en imágenes de tier gratuito. El coste sale de
`BCRYPT_ROUNDS` para poder bajarlo en las pruebas sin tocar código.

### Docker local: solo Postgres y Adminer

MinIO llega en el change de inscripción, junto con las variables de S3 y el primer código que
las usa. Añadirlo ahora dejaría un contenedor levantado que nada consume y variables sin uso.

## Variables de entorno

Son tres archivos porque tienen tres dueños distintos y tres momentos de lectura: el de la
raíz lo lee docker-compose al crear los contenedores, el del API al arrancar el proceso, y el
del frontend en tiempo de construcción.

`.env` (raíz, solo desarrollo local — en producción la base de datos es un servicio gestionado
y estas variables no existen):

| Variable | Ejemplo | Nota |
|---|---|---|
| `POSTGRES_USER` | `sion` | Credenciales del contenedor. Deben coincidir con `DATABASE_URL` |
| `POSTGRES_PASSWORD` | `sion` | |
| `POSTGRES_DB` | `sion` | |
| `POSTGRES_PORT` | `5432` | Puerto publicado. Cambiarlo si ya hay otro Postgres ocupándolo |
| `ADMINER_PORT` | `8080` | |

`apps/api/.env.example`:

| Variable | Ejemplo | Nota |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` | `3000` | Entero. El host de producción suele imponerlo |
| `DATABASE_URL` | `postgresql://sion:sion@localhost:5432/sion?schema=public` | URL de conexión |
| `CORS_ORIGIN` | `http://localhost:5173` | Origen exacto del frontend. Nunca `*` |
| `HEALTH_DB_TIMEOUT_MS` | `2000` | Tope de la comprobación de base de datos |
| `BCRYPT_ROUNDS` | `12` | Entero. Bajarlo en pruebas |
| `SEED_ADMIN_DOCUMENT_TYPE` | `CC` | Debe ser un `DocumentType` válido |
| `SEED_ADMIN_DOCUMENT_NUMBER` | `1000000000` | Identidad del admin original |
| `SEED_ADMIN_EMAIL` | `admin@unac.edu.co` | |
| `SEED_ADMIN_PASSWORD` | `cambiar-en-produccion` | Secreto; nunca se imprime |

`apps/web/.env.example`:

| Variable | Ejemplo | Nota |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Se resuelve en construcción; cambiarla exige reconstruir |

## Impacto en el despliegue

- `CORS_ORIGIN` se configura ya, aunque todavía no haya cookies, para que el change de cuentas
  solo tenga que añadir los atributos de la cookie y no descubrir CORS bajo presión.
- `VITE_API_URL` queda incrustada en el bundle. Cambiarla en Vercel **exige un redespliegue**;
  esto se documenta en el `README.md` para que no sorprenda más adelante.
- Nada en este change escribe en disco, en línea con la ausencia de almacenamiento persistente
  en el host del backend.

## Risks / Trade-offs

- **El esquema del frontend se valida en construcción y en ejecución, con el mismo esquema en
  dos contextos distintos.** → Vive en un único archivo de `packages/config`; si divergiera,
  el tipado del objeto que consume la aplicación dejaría de compilar.
- **`isSystem` es una marca en datos que ningún código de este change hace cumplir.** → El
  requisito queda escrito en `specs/initial-admin-account` y el change de la consola de
  administración lo implementa. Sin la columna, ese change tendría que adivinar cómo
  identificar la cuenta protegida.
- **Probar el fallo de arranque exige lanzar el proceso de verdad.** → La prueba arranca el API
  como proceso hijo con el entorno recortado y comprueba el código de salida y la salida de
  error. Es más lenta que una prueba unitaria, pero es la única que verifica el requisito real.
- **La prueba de la siembra escribe en la base de datos del desarrollador.** El seed garantiza
  que exista *una* sola cuenta de sistema, así que la prueba tiene que ser esa cuenta y no
  puede limitarse a limpiar lo suyo. → Guarda la cuenta existente antes de empezar y la
  restaura al terminar, de modo que `pnpm test` no se lleve por delante el administrador
  local. La alternativa correcta a largo plazo es una base de datos de pruebas aparte; se
  descarta ahora porque exigiría un segundo contenedor y un juego de migraciones propio para
  una sola prueba.
- **Un módulo `health` completo por cuatro líneas de lógica parece desproporcionado.** → Es
  deliberado. Es la referencia que los módulos siguientes van a copiar, y una plantilla
  incompleta se copia igual de bien que una completa.

## Migration Plan

No hay migración: el proyecto no tiene usuarios ni datos previos. La puesta en marcha local es
`docker compose up -d`, `pnpm install`, migrar y sembrar. La reversión es descartar el volumen
de Docker.
