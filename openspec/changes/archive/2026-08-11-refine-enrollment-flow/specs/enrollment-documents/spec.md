## MODIFIED Requirements

### Requirement: El aspirante adjunta los documentos exigidos

El sistema SHALL exigir tres documentos para poder enviar una inscripción: el documento de
identidad, los resultados de la prueba de estado y el diploma de bachiller. Cada uno SHALL poder
adjuntarse por separado y en cualquier orden.

#### Scenario: Se adjunta un documento

- **WHEN** un aspirante adjunta su documento de identidad
- **THEN** queda asociado a su inscripción y se le muestra como cargado

#### Scenario: Se ven cuáles faltan

- **WHEN** un aspirante consulta el paso de documentos
- **THEN** ve cuáles de los tres ha adjuntado y cuáles le faltan

#### Scenario: Se sustituye un documento

- **WHEN** un aspirante adjunta de nuevo un documento que ya había cargado
- **THEN** el nuevo reemplaza al anterior, y solo queda uno de ese tipo asociado

#### Scenario: Falta el diploma

- **WHEN** un aspirante intenta enviar habiendo adjuntado solo el documento de identidad y los
  resultados de la prueba de estado
- **THEN** el envío se rechaza indicando que falta el diploma de bachiller

## ADDED Requirements

### Requirement: Los documentos se previsualizan dentro de la aplicación

El sistema SHALL mostrar el contenido de un documento adjunto **dentro de la propia página**,
sin exponer la dirección de almacenamiento ni obligar a salir de la aplicación. La
previsualización SHALL estar disponible tanto para el dueño de la inscripción como para quien la
revisa, y SHALL ofrecer descargar el archivo.

#### Scenario: El administrador ve un documento mientras revisa

- **WHEN** un administrador abre un documento desde el detalle de una inscripción
- **THEN** lo ve dentro de la misma pantalla, sin abandonarla y sin que se le muestre una
  dirección de almacenamiento

#### Scenario: El aspirante comprueba lo que subió

- **WHEN** un aspirante abre un documento que acaba de adjuntar
- **THEN** lo ve, y puede reemplazarlo si descubre que subió el archivo equivocado o ilegible

#### Scenario: Se descarga desde el visor

- **WHEN** alguien con acceso a un documento pide descargarlo desde el visor
- **THEN** obtiene el archivo tal como se subió

#### Scenario: El visor se cierra y vuelve a lo anterior

- **WHEN** se cierra el visor
- **THEN** se vuelve a la pantalla desde la que se abrió, sin perder lo que hubiera en curso

#### Scenario: Un tipo que el navegador no sabe mostrar

- **WHEN** se abre un documento cuyo contenido no puede representarse en pantalla
- **THEN** se ofrece descargarlo, en lugar de mostrar un visor vacío o un error

#### Scenario: El acceso sigue siendo temporal y comprobado

- **WHEN** alguien sin derecho sobre una inscripción intenta previsualizar uno de sus documentos
- **THEN** la operación se rechaza igual que cualquier otro acceso a ese documento
