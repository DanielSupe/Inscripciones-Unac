## Why

El repositorio está vacío. Antes de poder escribir una sola pantalla de SION hace falta el
andamiaje sobre el que se apoyan los tres changes siguientes: el monorepo, la base de datos
local, el ORM, y —sobre todo— el mecanismo de configuración por variables de entorno que el
proyecto exige como requisito duro, porque la app se desplegará en servicios gratuitos donde
el frontend y el backend viven en dominios distintos.

Ese mecanismo no se puede añadir después. Si el primer módulo se escribe leyendo `process.env`
a mano o con una URL literal, el patrón se replica en todo lo que venga detrás. Este change
establece el patrón y lo demuestra con una rebanada vertical mínima que atraviesa todas las
capas: navegador → API → Prisma → Postgres.

## What Changes

- Se crea el monorepo con pnpm workspaces y Turborepo, con TypeScript en modo estricto y
  configuraciones de TypeScript y ESLint compartidas.
- Se crea `packages/config`, que declara con Zod el esquema de variables de entorno de cada
  app, lo valida al arrancar y detiene el proceso con un mensaje que nombra la variable
  faltante o inválida. Es el único lugar del repo autorizado a leer `process.env`.
- Se crea `packages/contracts` con los enums de dominio compartidos (`Role`,
  `DocumentType`, `EnrollmentStatus`, `PaymentStatus`) y la forma única de la respuesta de
  error de la API, que consumirán tanto el backend como el frontend.
- Se crea `apps/api` con Express, un middleware único de manejo de errores, las clases de
  error de dominio, y un módulo `health` que sirve como **plantilla de referencia** de la
  arquitectura de capas routes → controller → service → repository.
- Se crea `apps/web` con Vite, React, TanStack Router y TanStack Query, con un cliente HTTP
  único que toma la URL base de la configuración, y una pantalla que muestra el estado del
  API obtenido con `useQuery`.
- Se configura Prisma con el modelo `User` y sus enums, la migración inicial, y un seed
  idempotente que crea la cuenta de administrador original a partir de variables de entorno.
- Se añade `docker-compose.yml` con Postgres y Adminer para desarrollo local.
- Se añaden `.env.example` completos en cada app y un `README.md` con el arranque local.

## Fuera de alcance

Este change **no** entrega ninguna funcionalidad de negocio de SION:

- No hay registro de cuenta, ni inicio de sesión, ni sesiones, ni guards por rol. El único
  usuario que existe es el ADMIN semilla, y **no hay forma de iniciar sesión todavía**.
- No hay formulario de inscripción, ni máquina de estados, ni consola de administración.
- No hay integración con S3 ni con MinIO, ni generación de recibos en PDF. Esos servicios
  entran en el change de inscripción, junto con las variables de entorno que los configuran.
- No se siembran programas académicos ni periodos: llegan cuando exista algo que los use.
- No hay integración continua. El control de calidad es local (`lint`, `typecheck`, `test`).
- No hay diseño visual: la pantalla del frontend es deliberadamente mínima.

## Capabilities

### New Capabilities

- `runtime-configuration`: toda la configuración de ambas aplicaciones se declara, valida y
  consume desde un único lugar; el arranque falla de forma ruidosa y explícita cuando falta o
  es inválida una variable requerida.
- `platform-health`: el sistema expone su estado operativo, incluida la conectividad real con
  la base de datos, y el frontend lo consulta y lo muestra.
- `initial-admin-account`: el sistema se inicializa con exactamente una cuenta de rol ADMIN,
  creada desde configuración de forma idempotente y no eliminable.

### Modified Capabilities

Ninguna. `openspec/specs/` está vacío: este es el primer change del proyecto.

## Impact

- **Repositorio**: pasa de vacío a un monorepo con dos aplicaciones y cuatro paquetes. Fija la
  estructura de carpetas y la convención de módulos que seguirán todos los changes siguientes.
- **Base de datos**: se crea el esquema inicial con la tabla de usuarios y sus enums. El
  modelo `User` incluye desde ya `emailVerifiedAt` y `deletedAt`, aunque este change no los
  use, para no forzar migraciones evitables en los changes 2 y 4.
- **Dependencias nuevas**: pnpm, turbo, typescript, eslint, zod, express, cors, prisma,
  @prisma/client, @prisma/adapter-pg, pg, dotenv, bcrypt, react, vite, @tanstack/react-router,
  @tanstack/react-query, tsx, tsup, vitest, supertest, @testing-library/react, jsdom.

  Cuatro no estaban previstas y entraron por restricciones del herramental, no por decisión de
  diseño: `@prisma/adapter-pg`, `pg` y `dotenv` porque Prisma 7 saca la conexión del esquema y
  exige un adaptador de driver, y `tsup` porque los paquetes compartidos se consumen como
  TypeScript fuente y el build del API tiene que empaquetarlos. El detalle está en `design.md`.
- **Roles**: solo se ve afectado ADMIN, y únicamente en cuanto a su existencia en la base de
  datos. No se define todavía ninguna autorización.
- **Despliegue**: no se despliega nada aún, pero el esquema de configuración ya contempla
  `CORS_ORIGIN` y `VITE_API_URL` como variables obligatorias, de modo que la separación de
  dominios entre Vercel y el host del backend esté resuelta desde el primer commit.

## Supuestos

- El administrador original se identifica por documento y correo tomados de variables de
  entorno. Cambiar esas variables y volver a ejecutar el seed **no** crea un segundo
  administrador ni renombra al existente; el seed reconcilia sobre la identidad del documento.
- La contraseña del administrador semilla se almacena con `bcrypt` desde este change, aunque
  el flujo de inicio de sesión que la usará llegue en el siguiente.
- El endpoint de salud es público y no revela versiones, cadenas de conexión ni nombres de
  host, para no filtrar información antes de que exista autenticación.
