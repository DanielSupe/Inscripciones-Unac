## 1. Contrato y modelo de datos

- [x] 1.1 Añadir a `packages/contracts` los esquemas Zod del registro (documento, correo con confirmación, contraseña, aceptación de políticas) y del ingreso (correo y contraseña), con sus tipos derivados
- [x] 1.2 Añadir a `packages/contracts` el esquema y el tipo de la identidad propia: documento, correo y rol
- [x] 1.3 Añadir al esquema del entorno del API las seis variables nuevas, con `JWT_SECRET` requerido y sin valor por defecto
- [x] 1.4 Añadir a la validación del entorno la comprobación de coherencia entre `COOKIE_SAMESITE=none` y `COOKIE_SECURE=true`, para que una combinación imposible falle al arrancar y no en producción
- [x] 1.5 Añadir a `User` los campos `acceptedPolicyVersion` y `acceptedPolicyAt` como nulables, y generar la migración

## 2. Módulo `users`

- [x] 2.1 Crear `users.repository.ts` con la búsqueda por correo, la búsqueda por documento y la búsqueda por identificador, todas excluyendo las cuentas eliminadas salvo que se pida lo contrario
- [x] 2.2 Añadir al repositorio la creación de usuario, dejando que la violación del índice único se propague en vez de comprobar antes
- [x] 2.3 Crear `users.service.ts` con el alta de aspirante y la consulta de cuenta activa, traduciendo la violación de índice único a un `ConflictError` de dominio
- [x] 2.4 Crear el mapper que convierte la entidad en la identidad pública, garantizando que la contraseña almacenada nunca salga del módulo

## 3. Módulo `auth`: registro

- [x] 3.1 Implementar en `auth.service.ts` el registro: valida, cifra la contraseña, estampa la versión de políticas vigente y delega el alta en `usersService`
- [x] 3.2 Hacer que el registro devuelva el mismo error neutro tanto para documento duplicado como para correo duplicado, registrando en el servidor cuál fue el real
- [x] 3.3 Implementar `auth.controller.ts` y `auth.routes.ts` para el registro, declarando la ruta como pública de forma explícita
- [x] 3.4 Verificar que el esquema de entrada descarta cualquier campo no declarado, de modo que `role` o `isSystem` en la petición no lleguen a la capa de datos

## 4. Módulo `auth`: sesión

- [x] 4.1 Crear en `shared/` el emisor y el verificador del token de sesión, con el secreto y la duración tomados de la configuración
- [x] 4.2 Crear el emisor de la cookie de sesión, con `httpOnly` y con `secure` y `sameSite` tomados de la configuración
- [x] 4.3 Implementar el ingreso en `auth.service.ts`, comparando la contraseña contra un hash de descarte fijo cuando el correo no existe, para que el tiempo de respuesta no revele si la cuenta está registrada
- [x] 4.4 Implementar el controlador de ingreso: emite la cookie y devuelve la identidad, sin incluir el token en el cuerpo
- [x] 4.5 Implementar el cierre de sesión, que borra la cookie y termina sin error aunque no hubiera sesión
- [x] 4.6 Implementar la consulta de identidad propia, que resuelve la cuenta en la base de datos en cada petición y responde que no hay sesión si la cuenta fue eliminada

## 5. Autorización en el API

- [x] 5.1 Crear el middleware `requireAuth`, que lee la cookie, verifica la firma, resuelve la cuenta y deja la identidad disponible para el resto de la cadena
- [x] 5.2 Crear el middleware `requireRole`, que responde 403 cuando el rol no alcanza, sin revelar si el recurso existe
- [x] 5.3 Montar `cookie-parser` y revisar que CORS siga permitiendo credenciales contra el origen exacto
- [x] 5.4 Revisar todas las rutas existentes y declarar explícitamente cuáles son públicas, de modo que el default sea denegar

## 6. Frontend: sesión y rutas

- [x] 6.1 Crear `features/auth/api/` con las mutaciones de registro, ingreso y cierre de sesión, y la consulta de identidad propia con sus query keys
- [x] 6.2 Añadir al cliente HTTP el tratamiento global del 401: limpia la caché de consultas y redirige al ingreso con el aviso de sesión caducada
- [x] 6.3 Verificar que el 403 **no** dispara ese tratamiento, sino que se muestra como falta de permisos sin expulsar a la persona
- [x] 6.4 Crear el guard de ruta en el `beforeLoad` del router, que resuelve la identidad antes de montar el componente y redirige según el rol
- [x] 6.5 Crear las tres rutas de destino, una por rol, cada una protegida para su rol

## 7. Frontend: pantallas

- [x] 7.1 Crear el formulario de registro con validación con el esquema compartido, incluida la confirmación de correo y la casilla de políticas, con errores en español y accesibles
- [x] 7.2 Hacer que el registro exitoso lleve a la pantalla de ingreso con un mensaje de confirmación
- [x] 7.3 Crear el formulario de ingreso, que muestra el mismo mensaje neutro ante cualquier fallo de credenciales
- [x] 7.4 Crear la página pública de políticas de tratamiento de datos, enlazada desde el registro y sin perder lo escrito al volver
- [x] 7.5 Añadir el cierre de sesión a las tres pantallas de destino
- [x] 7.6 Hacer que una persona con sesión activa que abra el registro o el ingreso sea llevada a la zona de su rol
- [x] 7.7 Crear el marco de la zona autenticada como ruta de layout: header con marca, correo, rol y salir; menú lateral a la izquierda; enlace de salto al contenido
- [x] 7.8 Definir el menú lateral por rol, mostrando en gris y marcadas como «pronto» las secciones que aún no existen

## 8. Pruebas

- [x] 8.1 Probar el registro en el service: alta correcta, documento duplicado y correo duplicado devolviendo el mismo error, y que el rol resultante es siempre APPLICANT aunque la petición pida otro
- [x] 8.2 Probar que el registro guarda la versión de políticas vigente y su marca de tiempo, y que la contraseña no queda en texto plano
- [x] 8.3 Probar el ingreso en el service: credenciales correctas, contraseña incorrecta, correo inexistente y cuenta eliminada, comprobando que los tres fallos devuelven el mismo error
- [x] 8.4 Probar que el ingreso con un correo inexistente no responde apreciablemente más rápido que con una contraseña incorrecta
- [x] 8.5 Probar con Supertest que el ingreso emite la cookie con `httpOnly` y que el token no aparece en el cuerpo de la respuesta
- [x] 8.6 Probar con Supertest la identidad propia: con sesión válida, sin sesión, con firma manipulada, con sesión caducada y con la cuenta eliminada tras iniciarla
- [x] 8.7 Probar con Supertest los middlewares de autorización: sin sesión responde 401, con rol insuficiente responde 403, y ninguna de las dos revela si el recurso existe
- [x] 8.8 Probar que un rol enviado en el cuerpo de la petición se ignora y no altera lo que la persona puede hacer
- [x] 8.9 Probar los formularios de registro e ingreso: validación, mensaje neutro ante fallo y navegación posterior
- [x] 8.10 Probar el guard de ruta: sin sesión redirige al ingreso, con el rol equivocado no muestra el contenido, y con el rol correcto lo muestra
- [x] 8.11 Probar que un 401 limpia la caché y avisa de la sesión caducada, y que un 403 no expulsa

## 9. Documentación y cierre

- [x] 9.1 Añadir las seis variables nuevas a `apps/api/.env.example`, con valor de ejemplo y un comentario de una línea, y con la advertencia sobre la combinación de `COOKIE_SECURE` y `COOKIE_SAMESITE` en producción
- [x] 9.2 Actualizar el `README.md`: ya existe inicio de sesión, y cómo entrar por primera vez con el administrador semilla
- [x] 9.3 Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm test` y dejarlos en verde
- [x] 9.5 Aislar las pruebas de integración en su propio esquema de base de datos, para que `pnpm test` no destruya el administrador de la base de datos de desarrollo
- [x] 9.4 Verificar el recorrido completo a mano: registrar un aspirante, ingresar con él, comprobar que no entra a la zona de administración, cerrar sesión, e ingresar con el administrador semilla
