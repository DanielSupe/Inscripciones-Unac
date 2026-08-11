## 1. Contratos

- [x] 1.1 Añadir a `packages/contracts` los esquemas del listado paginado: parámetros de página, búsqueda y filtro, y la forma de la respuesta con su total
- [x] 1.2 Añadir los esquemas de alta, edición y restablecimiento de contraseña de una cuenta, rechazando el rol STUDENT en el propio esquema
- [x] 1.3 Añadir el esquema del rechazo, con el motivo obligatorio y no vacío
- [x] 1.4 Añadir los esquemas de alta y edición de periodo académico, con la comprobación de que el cierre es posterior a la apertura
- [x] 1.5 Añadir a la forma del recibo la marca de vencido, calculada y no almacenada

## 2. Módulo `users`: gestión de cuentas

- [x] 2.1 Añadir al repositorio el listado paginado con búsqueda por documento, correo y nombre, insensible a mayúsculas y por coincidencia parcial, con su total
- [x] 2.2 Añadir al repositorio la actualización de una cuenta y el borrado lógico
- [x] 2.3 Implementar en el service el alta de cuenta por parte del administrador, reutilizando las reglas de unicidad y de cifrado del registro público
- [x] 2.4 Implementar la edición, rechazando el rol STUDENT y respetando la unicidad de documento y correo
- [x] 2.5 Implementar el borrado lógico, y las tres protecciones de la cuenta de sistema: no eliminar, no cambiar de rol, sí restablecer contraseña
- [x] 2.6 Implementar las dos protecciones de auto-daño: nadie se elimina ni se degrada a sí mismo, comparando siempre contra el identificador de la sesión
- [x] 2.7 Implementar el restablecimiento de contraseña con el mismo mínimo y el mismo coste de cifrado que el registro
- [x] 2.8 Exponer la operación de cambio de rol para que la aprobación pueda invocarla dentro de su transacción
- [x] 2.9 Crear el controller y `users.admin.routes.ts`, con todas las rutas bajo `requireAuth` y `requireRole('ADMIN')`

## 3. Módulo `enrollment`: revisión

- [x] 3.1 Añadir al repositorio la bandeja paginada con filtro por estado y por periodo, incluyendo el aspirante, el programa y el estado del pago
- [x] 3.2 Implementar en el service la consulta de la bandeja, dejando fuera por defecto las inscripciones sin enviar
- [x] 3.3 Implementar tomar para revisión, invocando la transición ya declarada y dejando constancia de quién la tomó y cuándo
- [x] 3.4 Implementar la aprobación en una transacción que cambie el estado y promueva el rol, comprobando el pago verificado **dentro** de la transacción
- [x] 3.5 Implementar el rechazo con motivo obligatorio, rechazando el que venga vacío o solo con espacios
- [x] 3.6 Comprobar que el detalle y los documentos de cualquier inscripción son alcanzables por un ADMIN a través del filtro de pertenencia que ya existe, sin añadir excepciones nuevas
- [x] 3.7 Crear el controller y `enrollment.admin.routes.ts`, todas bajo `requireAuth` y `requireRole('ADMIN')`

## 4. Módulos `catalog` y `receipt`

- [x] 4.1 Añadir al repositorio de catálogo el alta y la edición de periodos, y el listado de todos incluidos los inactivos
- [x] 4.2 Implementar en el service la validación del código único y de que el cierre sea posterior a la apertura
- [x] 4.3 Implementar la desactivación de un periodo, que deja de admitir inscripciones nuevas sin afectar a las existentes
- [x] 4.4 Implementar en `receipt` la verificación del pago, con constancia de quién y cuándo, y su reversión
- [x] 4.5 Hacer que verificar un pago ya verificado termine sin error y sin alterar quién lo verificó
- [x] 4.6 Calcular la marca de vencido al presentar el recibo, sin almacenarla
- [x] 4.7 Crear los controllers y las rutas de administración de ambos módulos

## 5. Frontend: gestión de cuentas

- [ ] 5.1 Crear la feature de administración con sus hooks de consulta y mutación, y sus query keys
- [ ] 5.2 Crear la tabla de usuarios con paginación, búsqueda y filtro por rol
- [ ] 5.3 Crear el formulario de alta y edición de cuenta, sin ofrecer nunca el rol de estudiante
- [ ] 5.4 Añadir la eliminación con confirmación, y ocultar la acción cuando no procede sin dejar de comprobarlo en el servidor
- [ ] 5.5 Añadir el restablecimiento de contraseña, advirtiendo de que hay que comunicarla por fuera del sistema

## 6. Frontend: bandeja y decisión

- [ ] 6.1 Crear la bandeja de inscripciones con filtro por estado y por periodo, mostrando el estado del pago y el vencimiento
- [ ] 6.2 Crear el detalle de una inscripción, con todo lo declarado y los enlaces a sus documentos
- [ ] 6.3 Añadir la acción de tomar para revisión
- [ ] 6.4 Añadir la verificación del pago desde el detalle, con su reversión
- [ ] 6.5 Añadir aprobar y rechazar, con el motivo obligatorio en el rechazo y la aprobación deshabilitada mientras el pago siga pendiente
- [ ] 6.6 Crear la pantalla de periodos académicos con su alta y su edición
- [ ] 6.7 Dar destino a las cuatro entradas del menú lateral del administrador, que hasta ahora estaban marcadas como «pronto»

## 7. Pruebas

- [ ] 7.1 Probar que un administrador **sí** alcanza la inscripción de cualquier aspirante, que es la primera vez que se ejercita esa excepción en positivo
- [ ] 7.2 Probar que aprobar cambia el estado y el rol a la vez, y que el aspirante entra como estudiante después
- [ ] 7.3 Probar que aprobar sin el pago verificado se rechaza y no deja nada a medias, ni el estado ni el rol
- [ ] 7.4 Probar que rechazar sin motivo se rechaza, y que con motivo el aspirante lo ve
- [ ] 7.5 Probar el ciclo completo: enviar, tomar, verificar el pago, rechazar, corregir, reenviar, aprobar
- [ ] 7.6 Probar que la cuenta de sistema no se puede eliminar ni degradar, y que su contraseña sí se puede restablecer
- [ ] 7.7 Probar que nadie se elimina ni se degrada a sí mismo
- [ ] 7.8 Probar que crear o editar una cuenta con rol STUDENT se rechaza
- [ ] 7.9 Probar que un aspirante o un estudiante recibe 403 en todas las rutas de administración
- [ ] 7.10 Probar el listado: paginación, búsqueda parcial e insensible a mayúsculas, y que las cuentas eliminadas no aparecen
- [ ] 7.11 Probar la gestión de periodos: código repetido, fechas incoherentes, y que cambiar la tarifa no altera los recibos ya emitidos
- [ ] 7.12 Probar en el frontend la tabla de usuarios y la bandeja, y que aprobar aparece deshabilitado con el pago pendiente

## 8. Documentación y cierre

- [ ] 8.1 Actualizar el `README.md`: el ciclo está completo, y cómo entra un administrador a revisar
- [ ] 8.2 Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm test` y dejarlos en verde
- [ ] 8.3 Verificar a mano el recorrido completo desde el navegador, con dos sesiones: un aspirante que envía y un administrador que revisa, verifica y aprueba, comprobando que el aspirante pasa a ver la pantalla de estudiante
