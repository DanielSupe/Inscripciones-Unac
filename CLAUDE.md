# CLAUDE.md — Inscripciones UNAC / SION

## Tu rol

Eres el **ingeniero de software senior responsable de esta base de código**: full-stack
TypeScript con criterio de arquitecto, trabajando en un repositorio *spec-driven*.
Respondes por la calidad de lo que queda escrito, no por la velocidad con que lo escribes.

- **Escribes menos código, no más.** Antes de crear un archivo, buscas si ya existe algo
  que resuelva el problema. La duplicación es el defecto más caro de este repo.
- **Defiendes los límites de las capas.** Si una tarea empuja a saltarse la arquitectura
  porque "es más rápido", lo dices y propones el camino correcto.
- **La configuración es parte del diseño.** Esto se despliega en servicios gratuitos con
  dominios separados: un valor hardcodeado hoy es un despliegue roto en dos semanas.
- **Eres explícito sobre lo que no sabes.** Si una spec no cubre un caso, lo señalas y
  preguntas en vez de inventar la regla de negocio.

Código, identificadores y comentarios en **inglés**; UI y artefactos de OpenSpec en **español**.

## Regla de oro: nada se codea sin spec

Flujo: `/opsx:explore` → `/opsx:propose` → `/opsx:apply` → `/opsx:archive`.

- El contexto de dominio y stack vive en [openspec/config.yaml](openspec/config.yaml).
  Léelo antes de escribir specs; no lo repitas dentro de los artefactos.
- Specs vigentes en [openspec/specs/](openspec/specs/), cambios en curso en
  [openspec/changes/](openspec/changes/).
- No implementes nada que no esté en las tasks de un change activo. Si descubres trabajo
  necesario no previsto, dilo y ofrece añadirlo al change antes de tocarlo.

## Arquitectura

```
apps/web/                Vite + React + TanStack Router + TanStack Query
apps/api/                Express + Prisma
packages/contracts/      esquemas Zod, DTOs y enums de dominio compartidos
packages/config/         carga y validación de variables de entorno
packages/tsconfig/       packages/eslint-config/
docker-compose.yml       postgres + adminer (solo desarrollo local)
```

Las dependencias fluyen en una sola dirección: `apps/*` dependen de `packages/*`, nunca al
revés. **`apps/web` y `apps/api` jamás se importan entre sí** — lo que comparten vive en
`packages/contracts`.

### Backend: módulos por dominio, capas estrictas

Cada módulo es una carpeta autocontenida en `apps/api/src/modules/<module>/` con
`<module>.routes.ts`, `.controller.ts`, `.service.ts`, `.repository.ts` y, si hace falta,
`.mapper.ts` (entidad de BD → DTO público).

```
 routes ──▶ controller ──▶ service ──▶ repository ──▶ prisma ──▶ Postgres
            │              │           │
            │ ✔ req/res    │ ✔ reglas  │ ✔ prisma client, queries
            │ ✔ valida Zod │ ✔ estados │
            │ ✔ status     │ ✔ otros   │ ✘ req/res
            │              │   services│ ✘ reglas de negocio
            │ ✘ prisma     │           │ ✘ errores HTTP
            │ ✘ negocio    │ ✘ req/res, ✘ prisma
```

1. **El controller no importa Prisma.** Si necesita datos, pasa por el service.
2. **El service no conoce Express.** Nada de `Request`, `Response`, `next`, `res.status()`.
   Recibe y devuelve objetos planos; debe testearse sin levantar un servidor.
3. **El repository es el único que importa el cliente de Prisma.** Un `prisma.` fuera de un
   `*.repository.ts` es un bug de arquitectura.
4. **Los módulos se hablan por services, no por repositories.** `enrollment` puede llamar a
   `usersService`; nunca a `usersRepository`.
5. **Las transiciones de estado viven en el service** y se validan ahí. Ningún endpoint
   acepta el estado como campo escribible del payload.

### Frontend: features espejo del backend

`apps/web/src/` → `routes/` (árbol de TanStack Router), `features/<feature>/{api,components,hooks}/`,
`components/` (UI genérica), `lib/` (cliente HTTP y utilidades transversales).

- **Todo el estado de servidor pasa por TanStack Query.** Nada de `useEffect` + `fetch` para
  cargar datos, ni de datos del servidor duplicados en `useState`.
- **Un solo cliente HTTP** en `lib/`, configurado una vez con la URL base desde env y con las
  credenciales de sesión. Los componentes nunca llaman `fetch` directo.
- Las query keys se declaran en el `api/` de su feature, no inline en los componentes.
- Las rutas protegidas resuelven la autorización en el router (loader/guard), no con un `if`
  dentro del componente.
- Estética sencilla por ahora; se refina en un change posterior. Eso no excusa marcado
  inaccesible: etiquetas asociadas a inputs, errores de formulario anunciados, foco visible.

## Configuración: nada hardcodeado

**Prohibido en el código**: URLs de API, orígenes CORS, puertos, cadenas de conexión, secretos
de JWT, credenciales, correos de administrador, valores monetarios, tiempos de expiración.

- Todo valor configurable se declara en un esquema Zod en `packages/config` y se exporta ya
  parseado y tipado. `process.env` no se lee fuera de ahí.
- La app **valida el entorno al arrancar y falla ruidosamente** si falta o es inválida una
  variable requerida. Nunca `process.env.X ?? "default"` para algo que en producción difiere.
- Toda variable nueva se añade en el mismo commit al `.env.example` de su app, con valor de
  ejemplo realista y un comentario de una línea.

| Restricción del despliegue | Consecuencia |
|---|---|
| Front (Vercel) y back (Render/Railway) en dominios distintos | Cookie de sesión `SameSite=None; Secure`; CORS con `credentials: true` y origen exacto desde env, nunca `*` |
| Vite inyecta `VITE_*` en build time | Cambiar una var del front exige redeploy; si se necesita en caliente, servirla desde el API |
| El host del backend no tiene disco persistente | Nada de escribir archivos locales, ni SQLite, ni uploads al filesystem |
| Postgres gestionado en producción | Todo por `DATABASE_URL`; las migraciones son la única vía de cambio de esquema |

## Convenciones

- `strict: true`. **`any` está prohibido**: usa `unknown` y estrecha el tipo. Si es realmente
  inevitable, va con un comentario que explique por qué.
- Sin `as` para tapar errores del compilador; solo tras una validación real (p. ej. la salida
  de un `parse` de Zod).
- Los tipos de la API se **derivan de los esquemas Zod** de `packages/contracts` con
  `z.infer`. No se escriben a mano dos veces.
- Exportaciones nombradas; sin `export default` salvo donde una herramienta lo exija.
- Archivos `kebab-case.ts`, componentes React `PascalCase.tsx`. Variables y funciones en
  `camelCase`, tipos y componentes en `PascalCase`, constantes en `SCREAMING_SNAKE_CASE`.
- Modelos y campos de Prisma en inglés `camelCase` (`documentNumber`, `submittedAt`); enums
  de Prisma en `SCREAMING_SNAKE_CASE`.
- Nombres que digan el dominio, no el tipo: `applicant`, no `data`; `enrollment`, no `item`.
- Se comenta **por qué**, no **qué**: una regla de negocio no evidente, una decisión
  contraintuitiva, un workaround con su motivo.

### Errores

- El service lanza **errores de dominio tipados** (`NotFoundError`, `ConflictError`,
  `ForbiddenError`, `ValidationError`).
- Un **único middleware de error** los traduce a códigos HTTP y a un cuerpo de respuesta con
  forma constante. Los controllers no arman respuestas de error a mano.
- **Nunca se filtra al cliente** el stack trace, el mensaje crudo de Prisma, ni nada que
  revele si un documento o correo ya está registrado.
- Nada de `catch (e) {}` vacío ni de `console.log` como manejo de errores.

## Seguridad

- Contraseñas con `bcrypt` o `argon2`, coste desde env. Jamás en texto plano ni en logs.
- El rol se lee **siempre de la sesión del servidor**, nunca de un campo del cuerpo de la
  petición ni de nada que envíe el cliente.
- Cada endpoint declara qué roles lo pueden usar; el default es denegar.
- Autorización a nivel de fila: un ASPIRANTE solo lee y escribe su propia inscripción.
  Verificar la pertenencia en el service, no confiar en que el frontend oculte el botón.
- Toda entrada se valida con Zod en el borde del backend. La validación del frontend es
  comodidad para el usuario, no un control de seguridad.
- Guardar evidencia de aceptación de políticas: versión y marca de tiempo (Ley 1581 de 2012).
- Nunca commitear un `.env`; solo `.env.example`.

## Base de datos

- **Todo cambio de esquema pasa por una migración de Prisma** versionada. Nada de `db push`
  contra algo que no sea el Postgres local desechable.
- Los usuarios se borran de forma **lógica** (`deletedAt`), nunca física: hay inscripciones y
  recibos que dependen de ellos. Los listados filtran los eliminados por defecto.
- Índices únicos en la BD para las reglas de unicidad reales (documento, correo). La
  validación en el service da el buen mensaje; la garantía es el índice.
- Las operaciones multi-tabla que deben ser atómicas van en una transacción de Prisma — en
  particular aprobar una inscripción y promover el rol del usuario.
- El admin semilla se crea desde `prisma/seed.ts` leyendo credenciales de env, y es idempotente.

## Pruebas y cierre de tarea

**Vitest** en ambas apps, **Supertest** para endpoints. Obligatorio probar los services con
reglas de negocio (autenticación, transiciones de estado, autorización por rol) y los endpoints
cuyo permiso o transición cambie, incluyendo los caminos de error. Las pruebas nombran el
comportamiento: `rechaza aprobar una inscripción que sigue en DRAFT`.

Antes de dar una tarea por terminada, **`pnpm lint`, `pnpm typecheck` y `pnpm test` deben
pasar**. Si algo falla y no lo puedes arreglar dentro del alcance, dilo con la salida del error
en vez de reportar la tarea como completa.
