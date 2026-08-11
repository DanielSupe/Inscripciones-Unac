## 1. Base visual

- [ ] 1.1 Crear `apps/web/public/` e incorporar `sion-logo.png`, comprobando su peso y sus
      dimensiones reales. **Depende de que el archivo se guarde en el repositorio**; el resto
      del change puede avanzar sin él.
- [ ] 1.2 Declarar la paleta de `design.md` como variables CSS en `:root` de `styles.css`, sin
      reescribir todavía los estilos de las pantallas existentes.

## 2. Componentes genéricos

- [ ] 2.1 `components/carousel.tsx`: recibe una lista de piezas y muestra la activa. Con cero
      piezas pinta solo el marco; con una, la pieza sin controles; desde dos, flechas e
      indicadores con el activo señalado.
- [ ] 2.2 Añadir al carrusel el avance automático, su detención con el puntero encima o el foco
      dentro, y el respeto a `prefers-reduced-motion`. Navegable con teclado y con la pieza
      visible anunciada.
- [ ] 2.3 `components/password-field.tsx`: campo con botón de revelar y ocultar, con
      `aria-pressed` y etiqueta que cambia según el estado.

## 3. Pantalla de entrada

- [ ] 3.1 Componente de valores institucionales con los tres textos provisionales, marcados en
      el código como pendientes de confirmar. Contenido no enfocable: nada de enlaces ni botones.
- [ ] 3.2 `features/health/components/health-badge.tsx`: indicador compacto sobre
      `useHealthStatus`, que distingue operativo de degradado y **no** muestra el detalle del
      error.
- [ ] 3.3 Adaptar `login-form.tsx`: encabezado de bienvenida, campo de contraseña con revelado,
      y conservar los avisos de sesión caducada y cuenta creada tal como funcionan hoy.
- [ ] 3.4 Componer la pantalla en `routes/public-routes.tsx`: columna izquierda con carrusel,
      valores y pie; columna derecha con logotipo, bienvenida e ingreso.
- [ ] 3.5 Estilos de la pantalla, incluido el apilado por debajo de 900 px con el ingreso
      primero, y foco visible en todos los controles.

## 4. Rutas

- [ ] 4.1 Aplicar `redirectIfAuthenticated` a la ruta raíz.
- [ ] 4.2 Dejar `/ingresar` sin componente, redirigiendo a la raíz.
- [ ] 4.3 Reapuntar a `/` las cinco navegaciones internas que hoy van a `/ingresar`: cierre de
      sesión, caducidad al arrancar, registro completado, su enlace de pie y el guard de la zona
      protegida.
- [ ] 4.4 Eliminar `routes/home-route.tsx`, que no monta ninguna ruta desde el segundo change.

## 5. Pruebas

- [ ] 5.1 Carrusel: sin piezas no aparecen controles; con varias, avanza solo, se detiene con el
      foco dentro, y no avanza solo con movimiento reducido.
- [ ] 5.2 Campo de contraseña: revela, vuelve a ocultar y comunica su estado.
- [ ] 5.3 Pantalla de entrada: el formulario está disponible sin navegar, el aviso de sesión
      caducada se muestra una sola vez, y los valores no reciben foco.
- [ ] 5.4 Actualizar la prueba de `auth-forms.test.tsx` que hoy espera la navegación a
      `/ingresar` tras el registro.

## 6. Cierre

- [ ] 6.1 Buscar el literal `/ingresar` en `apps/web/src` y confirmar que solo queda en la
      definición de la ruta que redirige.
- [ ] 6.2 Comprobar la pantalla a 1440 px y a 390 px, con y sin el logotipo presente.
- [ ] 6.3 `pnpm lint`, `pnpm typecheck` y `pnpm test` en verde.
