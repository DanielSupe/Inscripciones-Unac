## 1. Infraestructura de almacenamiento

- [x] 1.1 Crear el bucket en AWS S3, cerrado al público, y anotar su nombre y región
- [x] 1.2 Configurar el CORS del bucket permitiendo `PUT` y `GET` desde el origen del frontend, exponiendo la cabecera `ETag`
- [x] 1.3 Crear un usuario de servicio con una política que le permita leer, escribir y borrar únicamente en ese bucket, y generar su credencial
- [x] 1.4 Añadir una regla de ciclo de vida que aborte las cargas multiparte incompletas a los 7 días, y un aviso de presupuesto en la cuenta
- [x] 1.5 Comprobar desde el navegador que una subida firmada llega al bucket, antes de escribir código que dependa de ello

## 2. Contrato y configuración

- [ ] 2.1 Añadir a `packages/contracts` los enums de dominio nuevos: sexo, jornada, modalidad y tipo de documento adjunto
- [ ] 2.2 Añadir a `packages/contracts` el esquema Zod de cada paso del wizard, cada uno validable por separado
- [ ] 2.3 Añadir el esquema de la inscripción completa, que es el que exige la transición de envío y el que produce los mensajes de qué falta
- [ ] 2.4 Añadir los esquemas y tipos del catálogo, del documento adjunto y del recibo
- [ ] 2.5 Añadir al esquema del entorno del API las nueve variables nuevas, con las credenciales del bucket requeridas y sin valor por defecto

## 3. Modelo de datos

- [ ] 3.1 Definir en el esquema de Prisma los modelos de programa y periodo académico con sus enums
- [ ] 3.2 Definir el modelo de inscripción con los campos de los tres pasos, nulables, y la unicidad de aspirante y periodo
- [ ] 3.3 Definir los modelos de documento adjunto y de recibo, con la unicidad de documento por tipo y la de recibo por inscripción
- [ ] 3.4 Crear la secuencia de numeración del recibo en la base de datos, para que dos envíos simultáneos no produzcan el mismo número
- [ ] 3.5 Generar y aplicar la migración
- [ ] 3.6 Ampliar el seed con los programas académicos y un periodo abierto, conservando su idempotencia

## 4. Módulo `catalog`

- [ ] 4.1 Crear el repositorio con la consulta de programas ofertados y la del periodo abierto en una fecha dada
- [ ] 4.2 Crear el service con la resolución del periodo vigente y la comprobación de que un programa está ofertado
- [ ] 4.3 Crear los endpoints públicos de consulta de programas y del periodo abierto, y la respuesta clara cuando no hay ninguno
- [ ] 4.4 Probar el service: periodo abierto, antes de abrir, después de cerrar, y sin ningún periodo configurado

## 5. Módulo `enrollment`: máquina de estados

- [ ] 5.1 Crear el módulo de transiciones que declara qué cambios de estado existen y qué condiciones exige cada uno
- [ ] 5.2 Implementar la condición de envío: datos completos, documentos completos y periodo abierto
- [ ] 5.3 Implementar la condición de aprobación: pago verificado. La usará el change 4
- [ ] 5.4 Implementar la transición de corrección, que devuelve una inscripción rechazada a estado editable
- [ ] 5.5 Probar exhaustivamente la máquina de estados, incluidas todas las transiciones no permitidas

## 6. Módulo `enrollment`: datos y pertenencia

- [ ] 6.1 Crear el repositorio con las consultas filtrando por dueño en la misma cláusula, de modo que un recurso ajeno devuelva vacío
- [ ] 6.2 Crear el service con la firma que exige la sesión junto al identificador, para que no se pueda pedir un recurso sin decir quién lo pide
- [ ] 6.3 Implementar la excepción de ADMIN en un único punto, documentada
- [ ] 6.4 Implementar el inicio de inscripción, que devuelve la existente si ya hay una para ese periodo
- [ ] 6.5 Implementar el guardado por pasos, que acepta datos parciales pero rechaza los que tengan formato inválido
- [ ] 6.6 Implementar el envío, que valida contra el esquema completo y delega la emisión del recibo
- [ ] 6.7 Implementar la consulta del proceso, incluido el motivo del último rechazo
- [ ] 6.8 Crear el controller y las rutas, todas protegidas y declarando los roles que las pueden usar

## 7. Módulo `documents`

- [ ] 7.1 Crear en `shared/storage/` el cliente del almacenamiento y el firmador, como único punto que habla con el bucket
- [ ] 7.2 Implementar la firma del permiso de subida, validando tipo y tamaño **antes** de firmar y componiendo la clave en el servidor
- [ ] 7.3 Implementar la confirmación de subida, que registra el documento y sustituye el anterior del mismo tipo
- [ ] 7.4 Implementar la firma del permiso de lectura, previa comprobación de pertenencia
- [ ] 7.5 Impedir adjuntar o sustituir documentos cuando la inscripción no es editable
- [ ] 7.6 Crear el controller y las rutas del módulo
- [ ] 7.7 Probar el service con un doble del almacenamiento: tipo no admitido, tamaño excedido, sustitución, y acceso a un documento ajeno

## 8. Módulo `receipt`

- [ ] 8.1 Crear el repositorio y el service de emisión, tomando el valor del periodo y copiándolo en el recibo
- [ ] 8.2 Implementar la numeración consecutiva por periodo apoyada en la secuencia de la base de datos
- [ ] 8.3 Implementar la consulta del recibo con comprobación de pertenencia
- [ ] 8.4 Implementar la generación del PDF con `pdfkit`, con los datos que exige la spec
- [ ] 8.5 Crear el controller y las rutas, incluida la descarga con su tipo de contenido y nombre de archivo
- [ ] 8.6 Probar que reenviar no emite un recibo nuevo y que el valor no cambia al cambiar la tarifa del periodo

## 9. Frontend: el wizard

- [ ] 9.1 Crear la feature de inscripción con sus hooks de consulta y mutación, y sus query keys
- [ ] 9.2 Crear el armazón del wizard con los cuatro pasos, la indicación de en cuál se está y la navegación entre ellos
- [ ] 9.3 Implementar el paso de datos personales
- [ ] 9.4 Implementar el paso de datos académicos previos
- [ ] 9.5 Implementar el paso de aspiración, con los programas y el periodo tomados del catálogo
- [ ] 9.6 Implementar el paso de documentos, con la subida directa al almacenamiento y el estado de cada adjunto
- [ ] 9.7 Hacer que al retomar una inscripción se abra el primer paso pendiente
- [ ] 9.8 Implementar el envío, con el resumen de qué falta cuando se rechaza

## 10. Frontend: consulta y recibo

- [ ] 10.1 Convertir la pantalla del aspirante en la consulta real del proceso, con su estado y el motivo del rechazo si lo hay
- [ ] 10.2 Añadir la acción de corregir y reenviar cuando la inscripción está rechazada
- [ ] 10.3 Crear la pantalla del recibo, con sus datos y la descarga del PDF
- [ ] 10.4 Activar en el menú lateral las secciones de inscripción y recibo, que hasta ahora estaban marcadas como «pronto»
- [ ] 10.5 Convertir la pantalla del estudiante en la consulta en solo lectura de su inscripción aprobada y su recibo
- [ ] 10.6 Mostrar un mensaje claro, y no un formulario, cuando no hay ningún periodo abierto

## 11. Pruebas

- [ ] 11.1 Probar que un aspirante no puede consultar ni modificar la inscripción de otro, y que la respuesta es indistinguible de que no exista
- [ ] 11.2 Probar que un aspirante no puede consultar el recibo ni los documentos de otro
- [ ] 11.3 Probar que el estado enviado en el cuerpo de una petición de guardado se ignora
- [ ] 11.4 Probar el envío incompleto: falta de datos y falta de documentos, cada uno con su mensaje
- [ ] 11.5 Probar que enviar dos veces no duplica el recibo
- [ ] 11.6 Probar el ciclo de rechazo y corrección de punta a punta
- [ ] 11.7 Probar que no se puede iniciar una inscripción con el periodo cerrado, y que una empezada tampoco se puede enviar
- [ ] 11.8 Probar que un aspirante solo puede tener una inscripción por periodo, y que puede tener otra en un periodo distinto
- [ ] 11.9 Probar el wizard en el frontend: guardado por pasos, retomar donde se dejó, y errores por campo
- [ ] 11.10 Probar la pantalla de proceso en sus estados: diligenciando, enviada, rechazada con motivo, y aprobada

## 12. Documentación y cierre

- [ ] 12.1 Añadir las nueve variables nuevas a `apps/api/.env.example`, con su valor de ejemplo y la advertencia de que las credenciales del bucket son secretas
- [ ] 12.2 Documentar en el `README.md` cómo montar el bucket y su CORS, porque sin eso el proyecto no arranca en una máquina nueva
- [ ] 12.3 Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm test` y dejarlos en verde
- [ ] 12.4 Verificar a mano el recorrido completo desde el navegador: diligenciar los cuatro pasos, subir los dos documentos, enviar, y descargar el recibo
