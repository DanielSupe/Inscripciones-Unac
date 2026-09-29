## Why

La pestaña de metas responde «cómo va cada facultad», pero al entrar al panel el ADMIN no ve nada
útil: la pantalla de inicio solo repite su correo y su documento. Las preguntas que se hace a diario
—cuál es la meta total de matriculados y cuánto llevamos, cuántos aspirantes hay en cada etapa,
cuántos pagos faltan por verificar— hoy exigen recorrer listados y contar a mano.

## What Changes

- La pantalla de inicio del panel de administración (`/admin`) pasa a ser un **tablero de
  indicadores** con tres bloques:
  - **Meta global de matriculados**: la suma de las metas de las facultades activas, los
    matriculados que cuentan para esa meta y el avance porcentual. Aparte, el total de matriculados
    de todas las facultades activas.
  - **Embudo de aspirantes**: cuántas inscripciones hay en cada estado del proceso, del borrador a
    la aprobación o el rechazo.
  - **Pagos**: cuántos recibos emitidos siguen pendientes y cuántos están verificados.
- El bloque de meta global enlaza a la pestaña de Metas para ver el detalle por facultad.
- Todo es de solo lectura y visible únicamente para ADMIN. APPLICANT, STUDENT y DEAN no lo ven ni
  pueden consultarlo.

### Supuestos

- **Los indicadores son acumulados, no del periodo en curso**, por coherencia con la meta global
  por facultad que ya existe. El tablero lo dice en pantalla.
- **El avance global solo compara lo comparable**: se calcula con los matriculados de las
  facultades que tienen meta, contra la suma de esas metas. Una facultad sin meta no infla el
  porcentaje; sus matriculados sí aparecen en el total, y el tablero dice cuántas facultades
  quedaron fuera del cálculo.
- Si ninguna facultad activa tiene meta, no hay meta global: se muestra «sin meta definida» en vez
  de un cero.
- Las inscripciones de usuarios eliminados lógicamente siguen contando: la inscripción y el recibo
  existieron, y borrar la cuenta no deshace el matriculado.

## Fuera de alcance

- Filtrar los indicadores por periodo, facultad o rango de fechas.
- Gráficas, series en el tiempo o comparación entre periodos.
- Montos de dinero recaudado o por recaudar.
- Actualización en tiempo real; los datos se refrescan al entrar o recargar.
- Indicadores para el DEAN sobre su propia facultad.

## Capabilities

### New Capabilities

- `admin-dashboard`: tablero de indicadores en el inicio del panel de administración — meta global
  de matriculados, embudo de aspirantes por estado y estado de los pagos.

### Modified Capabilities

Ninguna. La pestaña de metas (`enrollment-goals`) no cambia su comportamiento; el tablero consume
los mismos datos.

## Impact

- **Contratos**: esquema Zod nuevo para la respuesta del tablero en `packages/contracts`.
- **Backend**: módulo nuevo `apps/api/src/modules/dashboard/` sin repositorio propio: pide los
  conteos a los services dueños de cada dato (`goals`, `enrollment`, `receipt`), que ganan un
  método de conteo cada uno.
- **Frontend**: componente nuevo dentro de la feature `admin`, que ya reúne la consola; `AdminHome`
  pasa a mostrarlo.
- **Base de datos**: sin cambios de esquema ni migraciones.
- **Configuración y dependencias**: ninguna.
