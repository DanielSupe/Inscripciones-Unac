## Why

La pantalla pública de la raíz es todavía el andamio del primer change: un título, dos botones
y el panel de estado del sistema. No dice de qué institución es, no muestra nada que invite a
inscribirse, y obliga a un paso extra —pulsar «Ingresar»— antes de lo único que la mayoría
viene a hacer.

Es además la única pantalla que ve alguien que aún no tiene cuenta, así que es donde la
plataforma se presenta o no se presenta. Este change le da esa cara: el ingreso a la vista, la
identidad visual de SION y los valores de la institución.

## What Changes

- La pantalla pública de la raíz pasa a **contener el formulario de ingreso**, en lugar de un
  botón que lleva a él. Quien llega sin sesión puede escribir sus credenciales sin navegar.
- La ruta `/ingresar` **deja de tener pantalla propia y redirige a la raíz**. Se conserva como
  ruta porque de ella dependen el cierre de sesión, la caducidad de sesión y el registro
  recién completado; ninguno de esos caminos debe romperse.
- Se añade un **carrusel** en la mitad izquierda, con su rotación, sus controles y su
  navegación por teclado ya construidos. **Nace sin contenido**: es el soporte donde después
  entrarán las piezas de publicidad institucional.
- Bajo el carrusel, tres tarjetas con los **valores de la institución**, en el lugar donde SION
  pone accesos a soporte. Son contenido, no enlaces: no llevan a ninguna parte.
- Se incorpora el **logotipo de SION** como imagen versionada en el repositorio.
- El campo de contraseña gana un control para **revelar y ocultar** lo escrito.
- El panel de estado del sistema **baja al pie** de la pantalla, reducido a un indicador
  discreto. Sigue consultándose igual; solo deja de presidir la portada.

Decisiones tomadas al replicar la pantalla original, que este change **no** copia porque
prometerían comportamiento que el sistema no tiene:

- No se ofrece ingresar con número de documento: la autenticación sigue siendo por correo.
- No se añade «Mantenerme conectado»: la sesión tiene una única duración, fijada por
  configuración.
- No se añade «¿Has olvidado tu contraseña?»: no existe recuperación automática, y la
  restablece un ADMIN. Un enlace ahí sería una promesa vacía.

### Fuera de alcance

- El contenido del carrusel. Queda vacío, con su estructura funcionando.
- El texto definitivo de los valores institucionales. Se redacta una propuesta marcada como
  provisional, a la espera de los oficiales de la UNAC.
- Ingreso por número de documento, recuperación de contraseña y sesión persistente.
- Cualquier verificación anti‑robots. La pantalla original lleva reCAPTCHA; aquí no entra.
- El rediseño del registro y de las políticas, que conservan su aspecto actual.
- Las pantallas autenticadas, que ya tienen su marco y no se tocan.

### Supuestos

- El logotipo de SION se sirve como archivo estático del frontend, versionado en el repositorio.
  No se referencia desde un dominio ajeno, que sería una dependencia externa fuera de nuestro
  control y rompería el despliegue si cambiara.
- Los valores institucionales son contenido estable: viven en el código del frontend, no en la
  base de datos ni en configuración. Cambiarlos es un despliegue, no una operación de
  administración.

## Capabilities

### New Capabilities

- `public-entry`: qué encuentra y qué puede hacer quien llega a la plataforma sin sesión
  iniciada. Cubre que el ingreso esté disponible sin navegación previa, la presentación
  institucional, el comportamiento del carrusel y la regla de que esta pantalla no ofrezca
  acciones que el sistema no puede cumplir.

### Modified Capabilities

Ninguna. `authentication` sigue describiendo el mismo ingreso por correo y contraseña, y
`platform-health` el mismo punto de consulta: cambia dónde se pinta su resultado, no qué
significa.

## Impact

Solo `apps/web`. Sin migraciones, sin variables de entorno nuevas, sin cambios en
`packages/contracts` ni en `apps/api`.

- `src/routes/public-routes.tsx` — la portada se reescribe; `/ingresar` pasa a redirigir.
- `src/router.tsx` — la redirección de `/ingresar`.
- `src/features/auth/components/login-form.tsx` — mostrar/ocultar contraseña y encaje en el
  nuevo marco.
- `src/components/` — carrusel y campo de contraseña, ambos genéricos.
- `src/features/health/` — indicador discreto para el pie.
- `public/sion-logo.png` — activo nuevo, y con él la carpeta `public/`.
- `src/styles.css` — los estilos de la pantalla.
- Se retira `src/routes/home-route.tsx`, resto del primer change que ya no monta ninguna ruta.
