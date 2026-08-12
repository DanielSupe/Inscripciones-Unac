## Context

Ver `proposal.md` — Why.

Lo que condiciona el diseño, y que ya está en el código:

- El router resuelve la sesión en `beforeLoad`, antes de montar nada. Existe
  `redirectIfAuthenticated`, hoy aplicado a `/ingresar` y `/registro`.
- El aviso de «sesión caducada» y el de «cuenta creada» viven en un almacén de módulo que se
  consume una sola vez, no en la URL. Sobreviven a una redirección sin trabajo extra.
- Cinco sitios navegan a `/ingresar`: el cierre de sesión, la caducidad al arrancar, el registro
  completado, su enlace de pie y el guard de la zona protegida.
- `styles.css` es una hoja global única. No hay sistema de tokens ni motor de estilos.
- No hay carpeta `public/` en `apps/web`: este change la estrena.

## Goals / Non-Goals

**Goals**

- Que la pantalla de entrada se sostenga sola, sin depender de recursos externos.
- Que el carrusel nazca genérico y vacío, listo para recibir piezas sin volver a tocarlo.
- Que la identidad visual quede en variables CSS reutilizables, no dispersa en cada regla.

**Non-Goals**

- No se introduce un sistema de diseño ni una librería de componentes. Sigue siendo CSS propio.
- No se rediseña el registro ni las políticas, aunque compartan la paleta nueva.
- No se toca el marco autenticado.

## Decisions

### El ingreso vive en `/`, y `/ingresar` sobrevive como redirección

La pantalla de entrada es la raíz. `/ingresar` deja de tener componente y su `beforeLoad`
redirige a `/`.

Las cinco navegaciones internas se reapuntan a `/` en vez de encadenar un salto. La ruta se
conserva de todos modos porque puede estar en un marcador o en un correo, y una dirección que
alguien guardó no debería morir en un 404.

*Alternativas descartadas:* dejar las dos pantallas duplicaría el formulario y dividiría dónde
se ven los avisos. Borrar `/ingresar` del todo rompería enlaces guardados sin ganar nada.

### La raíz reutiliza `redirectIfAuthenticated`

Poner el formulario en la raíz crea un problema que antes no existía: quien ya tiene sesión
aterrizaría en una pantalla de ingreso. Se resuelve aplicando a la raíz el mismo `beforeLoad`
que ya protege `/ingresar` y `/registro`.

*Alternativa descartada:* comprobar la sesión dentro del componente. Pintaría el formulario y lo
sustituiría después, con el parpadeo correspondiente, y contradice la regla de resolver la
autorización en el router.

### El carrusel es componente genérico, no una pieza de esta pantalla

Va en `components/carousel.tsx`, junto al modal, porque no sabe nada del dominio: recibe una
lista de piezas y las rota. La composición de la pantalla se queda en `routes/public-routes.tsx`,
donde ya vive.

No se crea `features/public/`. Las carpetas de `features/` son espejo de los módulos del
backend, y una pantalla de bienvenida no tiene módulo detrás; inventar la carpeta rompería la
correspondencia que hace predecible el árbol.

**Contrato con cero piezas.** El carrusel arranca con la lista vacía y ese es su estado normal
durante un tiempo, no un caso degradado. Con cero piezas pinta el marco y **nada más**: sin
flechas, sin indicadores, sin temporizador y sin región anunciable. Con una pieza pinta la pieza
sin controles —no hay a dónde ir—. Los controles aparecen a partir de dos.

*Alternativa descartada:* montarlo con imágenes de relleno para «que se vea». Habría que
recordar quitarlas, y mientras tanto la pantalla mentiría sobre lo que la institución publica.

### El movimiento se detiene solo

El avance automático se detiene con el puntero encima o con el foco dentro, y no arranca si el
sistema pide reducir movimiento (`prefers-reduced-motion`). Un carrusel que cambia mientras
alguien lee es una trampa de accesibilidad conocida, y aquí convive con un formulario de
contraseña: el movimiento periférico compite con la tarea que de verdad importa.

### El campo de contraseña con revelado es un componente aparte

`components/password-field.tsx`, genérico. El registro y el restablecimiento del administrador
podrán adoptarlo después sin cambiarlo; este change **no** los toca, para no mezclar el rediseño
con una refactorización de pantallas que hoy funcionan.

El botón lleva `aria-pressed` y su etiqueta cambia entre «Mostrar contraseña» y «Ocultar
contraseña», que es lo que hace que el estado exista también para quien no ve la pantalla.

### El estado del sistema baja al pie como indicador propio

Se añade `HealthBadge` en la misma feature, apoyado en el mismo `useHealthStatus`. No es un
parámetro de `HealthPanel`: son dos presentaciones con propósitos distintos y ramificar una sola
función acabaría en un componente con dos vidas.

El indicador del pie **omite el detalle del error**, que `HealthPanel` sí muestra. En una
pantalla pública no aporta nada y es exactamente el tipo de texto que termina revelando de más.

### La paleta se deriva del logotipo

El azul del logotipo manda; todo lo demás se subordina. Como variables CSS en `:root`:

| Variable | Valor | Papel |
|---|---|---|
| `--sion-azul` | `#2d5b84` | El azul del logotipo. Acento, botón principal, enlaces |
| `--sion-azul-hondo` | `#1c4568` | Banda inferior izquierda, estados activos |
| `--sion-azul-tenue` | `#eef4f9` | Fondo de los campos del formulario |
| `--sion-tinta` | `#1f2733` | Texto principal |
| `--sion-gris` | `#5c6773` | Texto secundario y ayudas |
| `--sion-linea` | `#dde4ec` | Bordes y separadores |

Los tres círculos de las tarjetas usan tintes de igual peso —arena, salvia y cielo apagados— y
no el rosa/amarillo/verde del original. Allí esos colores codificaban tres **acciones
distintas**; aquí son tres valores de la misma jerarquía, y darles colores de semáforo
insinuaría una diferencia que no existe.

### Los valores institucionales viven en el código

Un array de módulo junto al componente que los pinta, con un comentario que los marca como
provisionales. No van a base de datos ni a variables de entorno: no los administra nadie, no
cambian por despliegue y no dependen del entorno. Meterlos en `.env` sería confundir contenido
con configuración.

### Composición

```
┌──────────────────────────────────┬───────────────────────┐
│  carrusel  (vacío por ahora)     │       [ logo ]        │
│  ◀  ● ● ●  ▶   ← desde 2 piezas  │                       │
├──────────────────────────────────┤  ¡Hola, bienvenido!   │
│  banda --sion-azul-hondo         │  texto de ayuda       │
│   ┌─────┐  ┌─────┐  ┌─────┐      │                       │
│   │  ●  │  │  ●  │  │  ●  │      │  Correo *             │
│   │valor│  │valor│  │valor│      │  Contraseña *    [ojo]│
│   └─────┘  └─────┘  └─────┘      │  [    Ingresar    ]   │
│                                  │  ¿No tienes cuenta?   │
│  © UNAC · SION      ● operativo  │                       │
└──────────────────────────────────┴───────────────────────┘
        ~57%                                ~43%
```

Por debajo de 900 px las dos columnas se apilan y **el ingreso va primero**: en un móvil, quien
llega viene a entrar, y hacerle pasar por el carrusel para llegar al formulario sería ordenar la
pantalla al revés de como se usa.

## Modelo de datos y configuración

Ninguno de los dos se toca. Sin migraciones, sin campos nuevos, sin variables de entorno
nuevas ni modificadas, y por tanto sin cambios en ningún `.env.example`.

Merece decirse por qué, dado que la regla del proyecto empuja a lo contrario: aquí no hay nada
que varíe entre entornos. El logotipo, los valores y la paleta son idénticos en local y en
producción. Una variable existe para que un valor pueda diferir por entorno; estos no pueden.

## Impacto en el despliegue

- `apps/web/public/` es nueva. Vite copia su contenido tal cual a `dist/`, y Vercel lo sirve
  como estático. El logotipo se referencia con ruta absoluta desde la raíz del sitio.
- El logotipo **se versiona en el repositorio**. Servirlo desde un dominio ajeno lo pondría
  fuera de nuestro control y lo expondría a bloqueos de contenido mixto o de CSP.
- Nada de esto afecta a CORS, a las cookies de sesión ni a la inyección de variables `VITE_*` en
  tiempo de build.

## Risks / Trade-offs

- **El carrusel vacío puede parecer un fallo.** → Ocupa su espacio con el fondo institucional y
  sin controles huérfanos, de modo que se lea como un espacio reservado y no como una imagen que
  no cargó.
- **Un logotipo pesado castiga la primera pantalla**, que es justo la que mide todo el mundo. →
  Se comprueba el peso del PNG al incorporarlo y se limita su tamaño mostrado por CSS.
- **Cinco navegaciones a `/ingresar` que reapuntar.** Olvidar una no rompe nada visible, porque
  la redirección la cubre, y por eso mismo puede quedarse ahí sin que nadie lo note. → Se
  verifica con una búsqueda del literal al cerrar el change, no a ojo.
- **La paleta nueva convive con las pantallas viejas**, que siguen con su aspecto actual. Habrá
  una discontinuidad visual entre la entrada y el resto hasta que se unifiquen. → Se asume: las
  variables quedan en `:root` para que el siguiente change las adopte sin reescribirlas.
- **`redirectIfAuthenticated` en la raíz añade una espera** a la primera pantalla, que ahora
  consulta la sesión antes de pintar. → Es la misma consulta que ya hacen `/ingresar` y
  `/registro`, y su resultado queda en caché para el resto de la visita.

## Migration Plan

No hay datos que migrar. El despliegue es el habitual del frontend; volver atrás es revertir el
commit. Nada en el backend cambia, así que las dos versiones del frontend funcionan contra el
mismo API.

## Open Questions

- El contenido definitivo del carrusel y el texto oficial de los valores. Ninguno de los dos
  cambia las specs, el enfoque ni el reparto de tareas: entran como datos en estructuras que
  este change deja construidas.
