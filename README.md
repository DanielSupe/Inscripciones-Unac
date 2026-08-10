# SION · Inscripciones UNAC

Plataforma de inscripción de nuevos estudiantes para la Universidad Adventista de Colombia.

> **Estado actual:** ya existen registro de cuenta e inicio de sesión, con control de acceso por
> rol. **Todavía no existen la inscripción, el recibo ni la consola de administración**: las
> pantallas de los tres roles son marcadores, y las secciones que faltan aparecen en el menú
> lateral marcadas como «pronto».
>
> Tampoco hay recuperación de contraseña —no hay envío de correo en el MVP— ni límite de
> intentos de ingreso. Ambas cosas están registradas como deuda conocida.

## Primer ingreso

Después de sembrar, entra en http://localhost:5173 con el administrador original: el correo y la
contraseña que pusiste en `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` de `apps/api/.env`. La
credencial de ingreso es el **correo**, no el documento.

Para probar el rol de aspirante, crea una cuenta desde «Crear cuenta»: nace siempre como
aspirante, sin importar lo que se envíe.

## Requisitos

- Node 22 o superior
- pnpm 11 o superior
- Docker Desktop

## Arranque local

```bash
# 1. Variables de entorno (los tres .env están fuera del control de versiones)
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 2. Base de datos y Adminer
docker compose up -d

# 3. Dependencias
pnpm install

# 4. Esquema y administrador original
pnpm --filter @repo/api db:migrate
pnpm --filter @repo/api db:seed

# 5. Ambas aplicaciones
pnpm dev
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000/health |
| Adminer | http://localhost:8080 |

En Adminer entra con el motor **PostgreSQL**, servidor `postgres`, y el usuario, contraseña y
base de datos que pusiste en el `.env` de la raíz.

**Si el puerto 5432 ya está ocupado** por otro Postgres, cambia `POSTGRES_PORT` en el `.env`
de la raíz y actualiza el puerto dentro de `DATABASE_URL` en `apps/api/.env`. Tienen que
coincidir.

## Comandos

```bash
pnpm dev                          # levanta API y frontend en paralelo
pnpm build                        # construye todo el monorepo
pnpm lint                         # eslint en todos los paquetes
pnpm typecheck                    # tsc --noEmit en todos los paquetes
pnpm test                         # vitest en todos los paquetes

pnpm --filter @repo/api db:migrate   # aplicar migraciones
pnpm --filter @repo/api db:seed      # sembrar el administrador original
pnpm --filter @repo/api db:studio    # explorador de Prisma
pnpm --filter @repo/api db:reset     # borrar y recrear la base de datos
```

`lint`, `typecheck` y `test` deben pasar antes de dar por terminada cualquier tarea.

## Estructura

```
apps/web                Vite + React + TanStack Router + TanStack Query
apps/api                Express + Prisma, módulos por dominio
packages/contracts      esquemas Zod, DTOs y enums compartidos entre front y back
packages/config         carga y validación de variables de entorno
packages/tsconfig       configuraciones base de TypeScript
packages/eslint-config  reglas de lint compartidas
```

Las convenciones de código y las reglas de arquitectura están en [CLAUDE.md](CLAUDE.md). Las
especificaciones y los cambios en curso, en [openspec/](openspec/).

## Configuración

Nada de lo que depende del entorno está escrito en el código. Todo entra por variables de
entorno, se valida con Zod en `packages/config`, y **la aplicación no arranca si falta o es
inválida alguna variable requerida** — con un mensaje que la nombra y que nunca imprime su
valor. Cada variable está documentada en el `.env.example` de su aplicación.

Hay tres archivos de entorno porque tienen dueños distintos:

| Archivo | Lo lee | Cuándo |
|---|---|---|
| `.env` | docker-compose | Al crear los contenedores |
| `apps/api/.env` | El backend y el seed | Al arrancar el proceso |
| `apps/web/.env` | Vite | **Al construir**, no en ejecución |

⚠ **Vite incrusta las variables `VITE_*` en el bundle durante la construcción.** Cambiar
`VITE_API_URL` en Vercel **exige un redespliegue** del frontend; no basta con reiniciar nada.
Por lo mismo, ahí nunca puede ir un secreto: acaba siendo público en el código que descarga el
navegador.

## Despliegue

Frontend en Vercel, backend en un host de tier gratuito, Postgres gestionado. El frontend y el
backend viven en dominios distintos, así que `CORS_ORIGIN` debe ser el origen **exacto** del
frontend, nunca `*`. El backend no tiene disco persistente: no escribe archivos locales.
