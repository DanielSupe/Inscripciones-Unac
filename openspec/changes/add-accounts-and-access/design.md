## Context

Ver `proposal.md` — Why para la motivación, y `specs/` para los requisitos observables.

El change anterior dejó el andamiaje y un único módulo, `health`, escrito como plantilla de las
capas routes → controller → service → repository. Este es el primer change con lógica de
negocio real, así que además de resolver la autenticación fija cómo se hablan los módulos entre
sí, y eso lo van a copiar los dos changes siguientes.

Tres restricciones lo condicionan:

1. Frontend y backend vivirán en dominios distintos, así que la cookie de sesión necesita
   atributos que **en desarrollo local no hacen falta y en producción son obligatorios**.
2. El host del backend es de tier gratuito: duerme, reinicia y puede levantar más de una
   instancia. Nada de estado de sesión en memoria del proceso.
3. Las specs exigen respuestas indistinguibles ante fallos, lo que obliga a cuidar tanto el
   mensaje como el tiempo de respuesta.

## Goals / Non-Goals

**Goals:**

- Que la autorización sea imposible de olvidar: que el default sea denegar y que exponer algo
  requiera un acto explícito.
- Que la diferencia entre local y producción viva entera en configuración, para que el
  despliegue no descubra sorpresas.
- Fijar la convención de comunicación entre módulos con el primer caso real que la necesita.

**Non-Goals:**

- No se construye un sistema de permisos granular. Rol por operación es suficiente para los
  tres roles que existen; un esquema de permisos finos sin un caso que lo pida sería adivinar.
- No se optimiza el coste del cifrado ni el tamaño de la credencial.

## Decisions

### Dos módulos, y `auth` no toca la base de datos de `users`

`users` es dueño del repositorio de `User`. `auth` implementa registro, ingreso, salida e
identidad propia, y para llegar a los datos pasa por `usersService`.

```
modules/users/    users.repository.ts   ← único acceso a User en todo el backend
                  users.service.ts
modules/auth/     auth.routes.ts / .controller.ts / .service.ts
                  (sin repository propio: usa usersService)
```

Podría parecer más simple meter todo en `auth`, pero el CRUD de usuarios del change 4 necesita
exactamente ese repositorio, y moverlo entonces significaría tocar auth para arreglar otra
cosa. Separarlo ahora cuesta un archivo y evita esa reescritura.

Consecuencia práctica: `auth.service` no importa `users.repository`. La regla ya la vigila
ESLint para Prisma, pero la disciplina entre módulos es responsabilidad de quien escribe.

### La sesión: JWT firmado en cookie `httpOnly`

Un único token de vida corta, sin refresh, tal como quedó decidido. Va en cookie `httpOnly`
para que ningún script de la página pueda leerlo, que es lo que exige la spec.

El token es autocontenido y no se guarda en la base de datos. A cambio, cerrar sesión solo
puede borrar la cookie: un token robado sigue siendo válido hasta que caduque. Se acepta porque
la vida es corta y porque mantener una lista de sesiones revocadas exigiría almacenamiento
compartido entre instancias.

Lo que sí se comprueba en cada petición es que la cuenta **siga existiendo y no esté
eliminada**: el token dice quién eres, la base de datos dice si todavía cuentas. Sin eso, la
spec «la cuenta se eliminó con la sesión abierta» no se cumpliría.

### Los atributos de la cookie son configuración, no literales

Es el punto que más fácilmente rompe el despliegue:

| | Local | Producción |
|---|---|---|
| Dominios | `localhost:5173` y `localhost:3000` — mismo sitio | Vercel y el host del API — sitios distintos |
| `SameSite` | `lax` | `none` |
| `Secure` | `false` | `true` |

Si se fijaran en el código con los valores de producción, el ingreso dejaría de funcionar en
local, porque `Secure` sobre HTTP hace que el navegador descarte la cookie. Si se fijaran con
los de local, funcionaría en la máquina de cada quien y fallaría en Vercel de la forma más
confusa posible: el ingreso responde bien y la petición siguiente llega sin sesión.

De ahí `COOKIE_SECURE` y `COOKIE_SAMESITE` como variables validadas al arrancar.

### Respuestas indistinguibles, también en el tiempo

Las specs exigen que el registro y el ingreso no permitan averiguar quién tiene cuenta. Con el
mensaje no basta:

- **En el ingreso**, si el correo no existe el sistema compara igualmente la contraseña contra
  un hash de descarte fijo antes de responder. Sin eso, la respuesta llega antes cuando la
  cuenta no existe y el mensaje neutro no sirve de nada.
- **En el registro**, documento duplicado y correo duplicado producen el mismo error de
  dominio, con el mismo texto. El detalle de cuál chocó se registra en el servidor.

La unicidad se resuelve capturando la violación del índice único, no consultando antes. Una
consulta previa deja una ventana entre la comprobación y la escritura por la que pasan dos
registros simultáneos; el índice no la tiene, y la spec pide justamente ese caso.

### La entrada del registro se declara campo a campo

El esquema Zod del registro lista exactamente los campos admitidos y descarta el resto. Así
`role` o `isSystem` en la petición no llegan a la capa de datos y la spec «el registro nunca
otorga privilegios» se cumple por construcción, no por acordarse de filtrar.

La confirmación del correo se valida en el esquema compartido, de modo que el frontend y el
backend apliquen la misma regla; el backend no la guarda.

### Autorización: dos middlewares y un default que deniega

`requireAuth` resuelve la sesión y deja la identidad disponible para el resto de la cadena.
`requireRole(...roles)` comprueba el rol. Las rutas públicas se declaran públicas de forma
visible en su archivo de rutas.

La comprobación de rol vive en el middleware y **no** en el service, a diferencia de las reglas
de negocio. Es autorización de transporte: quién puede llamar. La autorización sobre datos
concretos —«este aspirante solo ve su propia inscripción»— sí irá en el service, y llega en el
change 3.

### Frontend: la sesión es una consulta más

`useSession` es una consulta de TanStack Query contra la identidad propia. El router la resuelve
en el `beforeLoad` de las rutas protegidas, de modo que la redirección ocurre antes de montar
el componente y el contenido protegido no llega a renderizarse nunca.

El cliente HTTP único gana un tratamiento global: ante un 401 limpia la caché de consultas y
redirige al ingreso con el aviso de sesión caducada. Un 403 **no** hace eso: la sesión sigue
siendo válida y expulsar a alguien por pedir algo que no le toca sería mentirle. Esa distinción
está en las specs y es la parte más fácil de implementar mal.

### Modelo de datos

Dos columnas sobre el `User` existente:

```
User
  + acceptedPolicyVersion  String?
  + acceptedPolicyAt       DateTime?
```

Nulables porque el administrador semilla no pasa por el registro y no acepta nada. Una
migración, sin cambios en índices.

## Variables de entorno

Todas en `apps/api/.env.example`. Ninguna nueva en el frontend: la versión de políticas la
estampa el servidor, y el frontend solo muestra el texto.

| Variable | Ejemplo local | Nota |
|---|---|---|
| `JWT_SECRET` | *(cadena aleatoria larga)* | **Secreto. Requerido, sin valor por defecto** |
| `JWT_EXPIRES_IN` | `2h` | Duración de la sesión |
| `COOKIE_NAME` | `sion_session` | |
| `COOKIE_SECURE` | `false` | `true` en producción; con `true` sobre HTTP el navegador descarta la cookie |
| `COOKIE_SAMESITE` | `lax` | `none` en producción, por los dominios distintos |
| `POLICY_VERSION` | `2026-01` | Se estampa en cada registro |

`JWT_SECRET` no lleva valor por defecto a propósito: un default aquí es una firma que cualquiera
puede reproducir.

## Impacto en el despliegue

- `COOKIE_SAMESITE=none` exige `COOKIE_SECURE=true`; el navegador rechaza la combinación
  contraria. La validación de configuración debería comprobar esa coherencia al arrancar en vez
  de dejar que se descubra en producción.
- `CORS_ORIGIN`, que el change anterior dejó ya configurado, empieza a importar de verdad: sin
  el origen exacto y credenciales habilitadas, la cookie no viaja.
- No hay estado de sesión en el proceso, así que el backend sigue pudiendo reiniciarse o
  escalar sin que nadie pierda la sesión.

## Risks / Trade-offs

- **Sin límite de intentos de ingreso.** Decisión tomada a conciencia (ver `proposal.md` —
  Deuda). → La mitigación disponible hoy es el coste de bcrypt, que hace cada intento caro pero
  no lo impide. Debe resolverse antes de exponer la plataforma.
- **Cerrar sesión no invalida un token ya robado.** → Vida corta y comprobación de la cuenta en
  cada petición. La alternativa, una lista de revocación, exige almacenamiento compartido que
  este despliegue no tiene.
- **La cookie cross-site solo se prueba de verdad al desplegar.** En local ambos puertos son el
  mismo sitio, así que la configuración local nunca ejercita el camino que falla. → Que los
  atributos sean configuración permite probar la combinación de producción localmente forzando
  las variables, aunque el navegador la rechace sobre HTTP.
- **La comparación contra un hash de descarte gasta CPU en peticiones de correos inexistentes.**
  → Es exactamente el precio de que el tiempo de respuesta no filtre información, y con el
  coste de bcrypt configurable se mantiene acotado.
- **Un aspirante que olvide su contraseña queda bloqueado** hasta el change 4. → Conocido y
  aceptado; el admin podrá restablecerla desde el CRUD.

## Migration Plan

Una migración de Prisma que añade dos columnas nulables: no requiere reescribir datos y es
compatible con las filas existentes. El administrador semilla queda con ambas en nulo, que es
lo correcto. La reversión es revertir la migración; ninguna cuenta creada antes depende de esas
columnas.
