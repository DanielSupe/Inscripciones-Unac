## Context

Ver [proposal.md](./proposal.md). El tablero ya recibe todo lo que necesita salvo el detalle por
facultad, que ya existe en `GET /admin/faculty-goals` y en `useFacultyGoals()` de la feature
`goals`.

## Decisions

### Forma de cada bloque

| Bloque | Forma | Por qué |
|---|---|---|
| Meta global | Cifra destacada + medidor + fila de indicadores | Es una sola razón contra un límite: una gráfica de una barra no aporta más que el número |
| Avance por facultad | Barras horizontales con marca de meta (*bullet*) | Compara magnitudes entre facultades y cada una contra su propio objetivo |
| Aspirantes por etapa | Barras horizontales de un solo tono | Magnitud por categoría; los nombres de estado son largos y en horizontal caben |
| Pagos | Medidor de la proporción verificada + conteo de pendientes | Dos valores de un todo: un pastel de dos porciones diría menos que el número |

Descartado: donas para la meta y los pagos. Una dona de un solo valor ocupa más y se lee peor que
un medidor recto.

### Escala común en el avance por facultad

El máximo de la escala es el mayor entre todas las metas y todos los matriculados. Así una
facultad que superó su meta no se corta, y las barras se comparan entre facultades. Escalar cada
fila a su propia meta daría barras que no se pueden comparar entre sí.

### Color

- Marcas de datos: azul `#2a78d6`. El azul institucional `#2d5b84` falla el piso de croma del
  validador de paleta (se lee gris en una barra), así que se queda para títulos y enlaces.
- Pista de los medidores: `#cde2fb`, el paso claro de la misma rampa.
- Marca de meta: tinta principal, porque es una referencia y no una serie.
- Pendientes de pago: color de estado *warning* `#fab219` con icono y etiqueta, nunca solo color.
- Un solo tono para todas las barras del embudo: los estados no se distinguen por color, cada
  barra lleva su nombre.

### Accesibilidad

Las gráficas son `div` con ancho en porcentaje y `aria-hidden`. El dato que cuentan está escrito
como texto en la misma fila, así que un lector de pantalla recorre el bloque como una lista de
etiquetas y cifras. Los medidores usan `role="meter"` con su valor y su etiqueta. El `title` de
cada barra repite la cifra al pasar el cursor; es un refuerzo, no la única vía.

### Sin librería de gráficas

Barras y medidores son rectángulos proporcionales: se resuelven con CSS. Una librería añadiría
peso al bundle sin aportar nada que este tablero use.

## Risks / Trade-offs

- **Dos consultas en el inicio del panel** (`/admin/dashboard` y `/admin/faculty-goals`) → Son
  independientes y cada bloque maneja su carga y su error; si una falla, la otra sigue visible.
- **Sin modo oscuro** → Coherente con el resto de la app autenticada. Si llega el modo oscuro, los
  colores de este tablero ya viven en variables CSS y se redefinen en un solo sitio.
