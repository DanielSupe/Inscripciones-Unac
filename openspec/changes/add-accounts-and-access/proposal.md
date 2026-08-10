## Why

La plataforma tiene una cuenta de administrador en la base de datos y ninguna forma de entrar
como ella. No hay registro, no hay inicio de sesión, y ningún endpoint sabe quién está pidiendo
algo.

Todo lo que viene después depende de resolver eso primero. La inscripción del aspirante no
puede existir sin saber de quién es, y la consola del administrador no puede existir sin poder
negarle la entrada a quien no es ADMIN. La spec `initial-admin-account` ya exige que las
operaciones sobre la cuenta de sistema se rechacen «por falta de permisos» — hoy no hay nada
capaz de hacer cumplir esa frase.

Este change construye el mecanismo completo: crear cuenta, entrar, salir, y decidir qué puede
tocar cada rol.

## What Changes

- Se añade el **registro de cuenta**: tipo y número de documento, correo con confirmación,
  contraseña y aceptación de políticas. La cuenta nace con rol APPLICANT y queda registrada la
  versión de las políticas que aceptó y cuándo.
- Se añade el **inicio de sesión** con correo y contraseña, y el cierre de sesión. La sesión
  vive en una cookie que el navegador no deja leer desde JavaScript, y caduca sola.
- Se añade un punto de consulta de **identidad propia**, que responde quién eres y con qué rol,
  y es la única fuente de verdad que usa el frontend para decidir qué mostrar.
- Se añade **control de acceso por rol** en el API, con denegación por defecto: cada endpoint
  declara qué roles lo pueden usar, y quien no cumple recibe 401 o 403 sin enterarse de si el
  recurso existía.
- Se añaden **rutas protegidas en el frontend**, resueltas en el router antes de renderizar, y
  una pantalla de destino por rol.
- Se añade la **página de políticas de tratamiento de datos** como ruta pública.
- Se amplía el modelo `User` con la evidencia de aceptación de políticas.

## Fuera de alcance

- **Recuperación de contraseña.** Exige envío de correo, que no entra en el MVP. Ver Deuda.
- **Verificación del correo.** La confirmación del formulario valida que no haya un error de
  tipeo, no que el buzón exista. La columna para hacerlo ya está en el modelo desde el change
  anterior, sin usar.
- **Freno a los intentos por fuerza bruta.** Decisión explícita, no olvido. Ver Deuda.
- Inscripción, recibo y consola de administración: changes 3 y 4. Las pantallas de destino de
  los tres roles son marcadores de posición.
- Cambio de contraseña por parte de la propia persona una vez dentro.

## Capabilities

### New Capabilities

- `account-registration`: crear una cuenta de aspirante, con identidad única, evidencia de
  aceptación de políticas, y sin que el registro pueda otorgar privilegios.
- `authentication`: iniciar y cerrar sesión, sostenerla en el tiempo, y responder quién es la
  persona que está pidiendo algo.
- `access-control`: decidir qué puede hacer cada rol, tanto en el API como en la navegación del
  frontend, denegando por defecto.

### Modified Capabilities

Ninguna. `runtime-configuration` ya cubre de forma genérica que toda variable nueva se valide
al arrancar y se documente, e `initial-admin-account` ya describe el comportamiento esperado
ante un rol no autorizado. Este change empieza a hacer cumplir esa parte; no cambia lo que
dicen.

## Impact

- **Roles**: los tres. APPLICANT nace en el registro; ADMIN por fin puede entrar; STUDENT
  todavía no puede alcanzarse, porque solo se llega aprobando una inscripción y eso es el
  change 4.
- **Base de datos**: una migración que añade a `User` la versión de políticas aceptada y su
  marca de tiempo. Ambas nulables, porque el administrador semilla no pasa por el registro.
- **Configuración**: seis variables nuevas en el API, entre ellas el secreto de firma de la
  sesión y los atributos de la cookie. Dos de ellas valen distinto en local y en producción, y
  por eso son configuración y no literales.
- **Dependencias nuevas**: `jsonwebtoken` y `cookie-parser`, con sus tipos.
- **Arquitectura**: aparecen los dos primeros módulos de negocio, `users` y `auth`, que fijan
  cómo se hablan los módulos entre sí. El repositorio de `User` queda en `users` desde el
  principio, porque el CRUD del change 4 lo va a reutilizar.
- **Frontend**: aparece la noción de sesión, y con ella las primeras rutas protegidas y el
  primer manejo global de un error del API.

## Deuda que este change contrae a conciencia

Se listan aquí para que consten como decisión y no como descuido:

- **Sin límite de intentos de ingreso.** Un atacante puede probar contraseñas contra un correo
  conocido sin que nada lo frene. Se acepta para este change y debería resolverse antes de
  exponer la plataforma a internet.
- **Quien olvide su contraseña queda bloqueado** hasta que exista el CRUD de usuarios del
  administrador, en el change 4. No hay ninguna vía de auto-servicio.

## Supuestos

- El registro termina llevando a la pantalla de ingreso, no abriendo sesión por su cuenta. Así
  el registro y la autenticación siguen siendo dos flujos separados y la persona confirma que
  su contraseña quedó como creía.
- El texto de las políticas vive en el frontend y se identifica por una versión que fija la
  configuración. Cambiar el texto implica subir esa versión, de modo que quede constancia de
  quién aceptó cuál.
- La sesión no se renueva sola. Cuando caduca, la persona vuelve a ingresar.
