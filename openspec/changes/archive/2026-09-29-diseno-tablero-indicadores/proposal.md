## Why

El tablero de `/admin` ya da las cifras correctas, pero las presenta como listas de texto planas:
no se lee de un vistazo cuánto falta para la meta, qué facultad va atrasada ni dónde se acumulan
los aspirantes. Es un cambio en caliente, solo de presentación, para que la pantalla cumpla su
propósito de lectura rápida.

## What Changes

- **Meta global** como cifra destacada: el porcentaje de avance en grande, con un medidor debajo y
  una fila de indicadores (meta global, matriculados en total, facultades sin meta).
- **Gráfica nueva de avance por facultad** en el tablero: una barra por facultad activa con los
  matriculados y una marca en su meta, sobre una escala común. Las facultades sin meta aparecen
  con su barra y sin marca.
- **Aspirantes por etapa** como gráfica de barras horizontales, en el orden del proceso.
- **Pagos** como medidor de la proporción verificada, con el conteo de pendientes aparte.
- Tarjetas con superficie propia en lugar de bloques con borde.

Cada número sigue escrito como texto junto a su gráfica: las barras acompañan, no sustituyen.

### Supuestos

- La app autenticada no tiene modo oscuro; las gráficas tampoco lo tendrán en este change.
- Las gráficas se dibujan con HTML y CSS, sin librería de gráficas: son barras y medidores, y una
  dependencia nueva no se justifica para eso.

## Fuera de alcance

- Cambiar qué se cuenta o cómo: las cifras y el endpoint `/admin/dashboard` no cambian.
- Rediseñar la pestaña de Metas o el resto de la consola.
- Series en el tiempo, filtros o exportación.
- Modo oscuro.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `admin-dashboard`: el tablero muestra además el avance de cada facultad frente a su meta.

## Impact

- **Frontend**: `features/admin/components/admin-dashboard.tsx` se reescribe en varios componentes
  pequeños de gráfica, y `styles.css` gana los estilos del tablero. La gráfica por facultad reutiliza
  la query de la pestaña de Metas.
- **Backend, contratos, base de datos, configuración y dependencias**: sin cambios.
