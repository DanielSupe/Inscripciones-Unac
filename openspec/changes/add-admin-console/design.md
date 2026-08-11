## Context

Ver `proposal.md` — Why para la motivación y `specs/` para los requisitos.

Este es el change más barato de los cuatro, y no por casualidad: es el que recoge lo que los
anteriores dejaron preparado. No necesita migración, ni variables de entorno, ni dependencias, ni
módulos nuevos. Casi todo consiste en llamar a piezas que ya existen desde otro sitio.

Eso lo convierte también en la prueba de fuego de las decisiones anteriores. Si en algún momento
hay que reescribir una regla de transición o duplicar una comprobación de permisos, es que el
diseño de los changes 2 y 3 falló y conviene detenerse antes que parchear.

## Goals / Non-Goals

**Goals:**

- Que aprobar sea atómico: el estado de la inscripción y el rol de su dueño no pueden quedar
  desacompasados ni un instante.
- Que la excepción de ADMIN sobre la pertenencia siga viviendo en un solo punto, ahora que por
  fin se usa en positivo.
- No reescribir ninguna regla de negocio ya declarada.

**Non-Goals:**

- No se construye un sistema de auditoría. Se guarda quién hizo qué en la propia fila, como ya
  estaba previsto, y no hay bitácora de eventos.
- No se optimiza el listado. Con paginación en base de datos basta de sobra para el volumen de
  una universidad pequeña.

## Decisions

### Aprobar es una transacción, no dos escrituras

Aprobar toca dos tablas: el estado de la inscripción y el rol de su dueño. Van en una única
transacción de Prisma.

```
tx:  enrollment.status = APPROVED,  reviewedAt, reviewedByUserId
     user.role         = STUDENT
```

Si fueran dos escrituras sueltas, un fallo entre ellas dejaría o una inscripción aprobada cuyo
dueño sigue siendo aspirante —no vería su propia aprobación— o un estudiante sin inscripción
aprobada. Ninguno de los dos estados se puede explicar mirando la base de datos, que es la
definición práctica de corrupción de datos.

La comprobación de que el pago está verificado ocurre **dentro** de la transacción, leyendo el
recibo ahí mismo. Comprobarlo antes dejaría una ventana en la que otro administrador podría
deshacer la verificación entre la comprobación y la escritura.

### El listado pagina en la base de datos

`skip`/`take` con el total en la misma consulta, y la búsqueda como filtro `OR` sobre documento,
correo y nombre. Traer todo y filtrar en memoria funcionaría hoy con ocho usuarios y dejaría de
funcionar sin avisar.

La búsqueda es insensible a mayúsculas y busca por coincidencia parcial: quien busca «pere»
espera encontrar a Pérez.

### La excepción de ADMIN se usa, no se duplica

`enrollment.repository` ya tiene el filtro de pertenencia con su excepción para ADMIN, escrita
en el change anterior. La bandeja y el detalle pasan por ahí sin añadir nada.

Hasta ahora esa excepción solo se había probado en negativo —que un aspirante no alcance lo
ajeno—. Este change la ejercita en positivo por primera vez, así que hay que probar
explícitamente que **un ADMIN sí alcanza** la inscripción de cualquiera. Si estuviera mal, la
consola entera no funcionaría.

### Las transiciones se invocan, no se reescriben

`enrollment.transitions.ts` declara desde el change anterior `takeForReview`, `approve` y
`reject`, con sus estados de origen y sus mensajes. El service de revisión llama a
`applyTransition` y añade únicamente lo que depende de datos: el pago verificado al aprobar, y
el motivo no vacío al rechazar.

No hay que tocar ese archivo. Si hiciera falta, sería la señal de que las reglas quedaron mal
repartidas.

### Las protecciones de la cuenta de sistema, en el service

`isSystem` está en el modelo desde el primer change precisamente para este momento. Las tres
reglas —no eliminar, no cambiar de rol, sí restablecer contraseña— viven en `users.service`, no
en el controller: son de negocio, y el change de despliegue o cualquier consola futura tienen que
heredarlas sin volver a escribirlas.

Junto a ellas van las dos de auto-protección: nadie se elimina ni se degrada a sí mismo. La
comparación es contra el identificador de la sesión, nunca contra algo que venga en la petición.

### Restablecer contraseña reutiliza el cifrado del registro

Mismo mínimo de longitud y mismo coste de cifrado, tomados del mismo sitio. Una contraseña
puesta por el administrador no puede ser más débil que una puesta por su dueño.

El administrador conoce esa contraseña, y no hay forma de obligar a cambiarla: haría falta una
marca en el modelo y una pantalla de cambio forzoso. Queda anotado como deuda en el proposal.

### El vencimiento se calcula, no se almacena

Un recibo está vencido si su pago sigue pendiente y su fecha ya pasó. Es una función de dos
datos que ya existen, así que se calcula al presentarlo.

Guardarlo como estado obligaría a un proceso que lo actualizara, y ese proceso es exactamente lo
que decidimos no construir. Además quedaría desfasado entre ejecuciones.

## Estructura

Ningún módulo nuevo. Se amplían los cuatro que existen, y cada uno gana su propio archivo de
rutas de administración para que quede a la vista qué está reservado:

```
modules/users/       + listado paginado, alta, edición, borrado lógico, reset
                     + users.admin.routes.ts
modules/enrollment/  + bandeja, tomar, aprobar, rechazar
                     + enrollment.admin.routes.ts
modules/catalog/     + alta y edición de periodos
modules/receipt/     + verificar y deshacer verificación
```

Toda ruta de administración lleva `requireAuth` y `requireRole('ADMIN')`, sin excepción.

Frontend: `features/admin/` con la tabla de usuarios, la bandeja de inscripciones, el detalle de
una inscripción y la gestión de periodos, dentro del marco que ya existe. Las cuatro entradas
del menú lateral del administrador reciben su destino.

## Variables de entorno

Ninguna nueva. El tamaño de página es una constante del código: no cambia entre entornos, así
que no es configuración.

## Risks / Trade-offs

- **La excepción de ADMIN nunca se ha ejercitado en positivo.** → Se prueba explícitamente que un
  administrador alcanza la inscripción de otro, además de las pruebas existentes de que un
  aspirante no.
- **Aprobar cruza dos módulos**: `enrollment` cambia el estado y `users` el rol. → La transacción
  se abre en el service de inscripción, que es quien orquesta, y `users` expone la operación de
  cambio de rol para que se ejecute dentro. Ningún módulo toca el repositorio del otro.
- **Los listados pueden mostrar cuentas eliminadas** a través de sus inscripciones, porque el
  borrado es lógico y la inscripción sobrevive. → Es correcto y hay que mostrarlo como tal, no
  ocultarlo: quien revisa necesita saber que esa persona ya no tiene cuenta.
- **El administrador conoce las contraseñas que restablece.** → Deuda aceptada; revisar cuando
  exista envío de correo.
- **La bandeja crece indefinidamente** con inscripciones impagas, porque el vencimiento no
  cancela nada. → Con volumen real hará falta un filtro por antigüedad; hoy no lo justifica.

## Migration Plan

Ninguna migración. Las columnas que este change escribe —quién revisó y cuándo, el motivo del
rechazo, quién verificó el pago— existen desde el change anterior sin haberse usado. Las
inscripciones ya enviadas quedan disponibles en la bandeja desde el primer arranque.
