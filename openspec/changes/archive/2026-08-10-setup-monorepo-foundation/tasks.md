## 1. Andamiaje del monorepo

- [x] 1.1 Inicializar el repositorio con `package.json` raíz, `pnpm-workspace.yaml` apuntando a `apps/*` y `packages/*`, y `.gitignore` que excluya `node_modules`, `dist` y todo archivo `.env`
- [x] 1.2 Crear `packages/tsconfig` con la base estricta (`strict: true`, `noUncheckedIndexedAccess`) y los presets para librería, para Node y para React
- [x] 1.3 Crear `packages/eslint-config` con la configuración compartida, incluida la regla que prohíbe importar el cliente de Prisma fuera de archivos `*.repository.ts`
- [x] 1.4 Configurar `turbo.json` con las tareas `dev`, `build`, `lint`, `typecheck` y `test`, declarando sus dependencias entre paquetes
- [x] 1.5 Añadir al `package.json` raíz los scripts `dev`, `build`, `lint`, `typecheck` y `test` que delegan en Turborepo

## 2. Contratos y configuración compartidos

- [x] 2.1 Crear `packages/contracts` con los enums de dominio `Role`, `DocumentType`, `EnrollmentStatus` y `PaymentStatus`, y sus tipos derivados
- [x] 2.2 Añadir a `packages/contracts` el esquema y el tipo de la respuesta de error de la API, con la forma `{ error: { code, message, details? } }`
- [x] 2.3 Crear `packages/config` con el esquema Zod del entorno del API y el del frontend, ambos en un único archivo por aplicación
- [x] 2.4 Implementar en `packages/config` el formateador de errores de validación: agrupa todos los problemas en un solo mensaje, nombra cada variable y su formato esperado, y nunca imprime valores
- [x] 2.5 Exponer la entrada `@repo/config/server`, que parsea `process.env` al importarse y termina el proceso con código 1 si la validación falla
- [x] 2.6 Exponer la entrada `@repo/config/web`, que publica el esquema del frontend sin parsear, para consumirlo tanto en la construcción como en ejecución

## 3. Base de datos

- [x] 3.1 Crear `docker-compose.yml` con los servicios `postgres` y `adminer`, con volumen persistente y credenciales tomadas del entorno
- [x] 3.2 Definir en `apps/api/prisma/schema.prisma` el modelo `User` y los enums `Role` y `DocumentType`, con el índice único compuesto de documento y el índice único de correo
- [x] 3.3 Generar y versionar la migración inicial, y verificar en Adminer que la tabla y sus índices quedan creados
- [x] 3.4 Implementar `apps/api/prisma/seed.ts` con el `upsert` idempotente de la cuenta de administrador original sobre la clave de documento, con la contraseña cifrada con bcrypt
- [x] 3.5 Añadir al seed la comprobación previa de conflicto: si ya existe una cuenta con `isSystem` cuyo documento no coincide con la configuración, abortar con un mensaje explicativo sin escribir nada
- [x] 3.6 Añadir a `apps/api` los scripts `db:migrate`, `db:seed`, `db:studio` y `db:reset`

## 4. Backend

- [x] 4.1 Crear `apps/api` con Express y TypeScript, importando la configuración del servidor como primera instrucción del arranque
- [x] 4.2 Configurar el middleware de CORS con el origen exacto tomado de `CORS_ORIGIN` y con credenciales habilitadas
- [x] 4.3 Crear en `apps/api/src/shared/errors/` las clases `NotFoundError`, `ConflictError`, `ForbiddenError` y `ValidationError`
- [x] 4.4 Implementar el middleware único de manejo de errores: traduce los errores de dominio a códigos HTTP, registra íntegro cualquier error no reconocido y responde 500 con mensaje genérico, sin trazas ni mensajes crudos del ORM
- [x] 4.5 Implementar `health.repository.ts` con la consulta `SELECT 1` contra Postgres, envuelta en el tope de tiempo de `HEALTH_DB_TIMEOUT_MS`
- [x] 4.6 Implementar `health.service.ts` con la decisión de si el sistema está sano, sin ninguna referencia a tipos de Express
- [x] 4.7 Implementar `health.controller.ts` y `health.routes.ts`, respondiendo 200 cuando el sistema está sano y 503 cuando la base de datos está degradada, sin exponer host, credenciales ni trazas
- [x] 4.8 Montar el enrutador en la aplicación y verificar manualmente `GET /health` con la base de datos arriba y con la base de datos detenida

## 5. Frontend

- [x] 5.1 Crear `apps/web` con Vite, React y TypeScript
- [x] 5.2 Validar el entorno en `vite.config.ts` con `loadEnv` y el esquema compartido, de forma que la construcción falle si falta una variable requerida
- [x] 5.3 Crear `src/lib/config.ts` que parsea `import.meta.env` con el mismo esquema y exporta el objeto validado y tipado
- [x] 5.4 Crear `src/lib/http.ts` con el cliente HTTP único, que toma la URL base de la configuración, envía credenciales y tipa la respuesta de error usando el contrato compartido
- [x] 5.5 Configurar TanStack Query con su proveedor y TanStack Router con el árbol de rutas y una ruta raíz
- [x] 5.6 Crear la feature `health` con su hook de consulta en `features/health/api/` y su query key declarada allí
- [x] 5.7 Crear la pantalla que muestra el estado del sistema distinguiendo carga, sistema operativo y sistema inalcanzable, con textos en español y marcado accesible

## 6. Pruebas

- [x] 6.1 Configurar Vitest en `apps/api` y en `apps/web`, y Supertest en el API
- [x] 6.2 Probar el esquema de configuración: entorno válido, variable faltante, variable con formato inválido, y varias inválidas a la vez reportadas en un solo mensaje
- [x] 6.3 Probar que el mensaje de error de configuración nombra la variable de un secreto inválido sin imprimir su valor
- [x] 6.4 Probar el arranque real del API como proceso hijo con el entorno recortado, comprobando el código de salida distinto de cero y el contenido de la salida de error
- [x] 6.5 Probar `health.service` con la base de datos respondiendo, fallando y agotando el tope de tiempo
- [x] 6.6 Probar con Supertest que `GET /health` responde 200 con la base de datos sana y 503 cuando está degradada, y que el cuerpo no contiene cadena de conexión, host ni traza
- [x] 6.7 Probar la idempotencia del seed: dos ejecuciones seguidas dejan exactamente una cuenta de administrador; cambiar correo y contraseña reconcilia la existente; cambiar el documento aborta sin crear una segunda cuenta

## 7. Documentación y cierre

- [x] 7.1 Escribir `apps/api/.env.example` completo, con todas las variables de la tabla de `design.md`, su valor de ejemplo y un comentario de una línea
- [x] 7.2 Escribir `apps/web/.env.example` con `VITE_API_URL` y la advertencia de que se resuelve en construcción
- [x] 7.3 Escribir el `README.md` raíz con el arranque local paso a paso, la nota de que cambiar `VITE_API_URL` exige reconstruir el frontend, y la aclaración de que en este change todavía no existe inicio de sesión
- [x] 7.4 Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm test` y dejarlos en verde
- [x] 7.5 Verificar el recorrido completo en limpio: levantar Docker, instalar, migrar, sembrar dos veces, arrancar ambas apps y comprobar que la pantalla muestra el estado del sistema
