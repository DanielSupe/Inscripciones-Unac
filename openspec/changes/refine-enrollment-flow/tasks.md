## 1. Contratos y modelo de datos

- [x] 1.1 Añadir `DIPLOMA` a los tipos de documento adjunto, con su etiqueta en español
- [x] 1.2 Eliminar el esquema del paso académico y sus cuatro campos, y quitar `academic` de la lista de pasos del wizard
- [x] 1.3 Ajustar el esquema de la inscripción completa para que ya no exija los campos académicos
- [x] 1.4 Eliminar del modelo de Prisma las cuatro columnas académicas y añadir `DIPLOMA` al enum de tipos de documento
- [x] 1.5 Generar y aplicar la migración

## 2. Backend

- [x] 2.1 Quitar los campos académicos del mapeo de borrador y de la asignación de pasos pendientes
- [x] 2.2 Quitar los campos académicos del guardado por pasos
- [x] 2.3 Comprobar que la regla de documentos faltantes exige los tres sin tocarla, porque compara contra el catálogo de tipos
- [x] 2.4 Actualizar las pruebas de integración que diligencian una inscripción completa, para que adjunten los tres documentos y no envíen datos académicos

## 3. Visor de documentos

- [x] 3.1 Crear el componente de visor: pide la dirección firmada al abrirse, la muestra según el tipo de contenido, y no la expone
- [x] 3.2 Mostrar los PDF en un marco embebido y las imágenes como imagen, con descarga siempre disponible
- [x] 3.3 Ofrecer solo la descarga cuando el tipo no se pueda representar, en lugar de un visor vacío
- [x] 3.4 Cerrar el visor devolviendo a la pantalla anterior, sin perder lo que hubiera en curso
- [x] 3.7 Extraer un componente de ventana modal con el foco atrapado, el desplazamiento de fondo bloqueado y el foco devuelto al cerrar
- [x] 3.8 Usarlo en el visor y en los tres formularios de la consola —cuenta, contraseña y periodo—, que también aparecían al pie de la página
- [x] 3.5 Usar el visor en el detalle de la revisión, sustituyendo el enlace que hoy muestra JSON
- [x] 3.6 Usar el mismo visor en el paso de documentos del aspirante, para que compruebe lo que subió

## 4. Rediseño de la inscripción

- [x] 4.1 Definir la dirección visual del trámite: paleta, tipografía y composición, antes de escribir estilos
- [x] 4.2 Rediseñar el indicador de pasos para que se lea de un vistazo dónde se está y qué falta
- [x] 4.3 Dar al formulario el ancho y el aire que le corresponden, conservando los tres pasos
- [x] 4.4 Rediseñar el paso de documentos con los tres adjuntos, su estado y el acceso al visor
- [x] 4.5 Conservar lo que ya funcionaba: etiquetas asociadas, errores anunciados, foco visible y comportamiento en pantalla estrecha

## 5. Pruebas y cierre

- [x] 5.1 Probar que el wizard tiene tres pasos y que ninguno pide datos de la prueba de estado
- [x] 5.2 Probar que no se puede enviar sin el diploma, y que el mensaje dice cuál falta
- [x] 5.3 Probar el visor: que pide la dirección al abrirse, que ofrece descarga, y que no muestra la dirección firmada
- [x] 5.4 Probar que un documento ajeno sigue rechazándose desde el visor igual que desde cualquier otro camino
- [x] 5.5 Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm test` y dejarlos en verde
- [x] 5.6 Verificar a mano desde el navegador: inscribirse en tres pasos, adjuntar los tres documentos, verlos en el visor, enviar, y abrirlos como administrador
