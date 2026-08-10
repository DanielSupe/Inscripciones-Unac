# enrollment-documents Specification

## Purpose
Permite al aspirante adjuntar los documentos que la universidad exige para revisar su inscripción,
con el archivo viajando del navegador al almacenamiento sin atravesar el servidor, que no tiene
disco ni capacidad para hacer de intermediario.
## Requirements
### Requirement: El aspirante adjunta los documentos exigidos

El sistema SHALL exigir dos documentos para poder enviar una inscripción: el documento de
identidad y los resultados de la prueba de estado. Cada uno SHALL poder adjuntarse por separado y
en cualquier orden.

#### Scenario: Se adjunta un documento

- **WHEN** un aspirante adjunta su documento de identidad
- **THEN** queda asociado a su inscripción y se le muestra como cargado

#### Scenario: Se adjuntan los dos y se ve el estado

- **WHEN** un aspirante consulta el paso de documentos
- **THEN** ve cuáles ha adjuntado y cuáles le faltan

#### Scenario: Se sustituye un documento

- **WHEN** un aspirante adjunta de nuevo un documento que ya había cargado
- **THEN** el nuevo reemplaza al anterior, y solo queda uno de ese tipo asociado

### Requirement: El archivo no pasa por el servidor

El sistema SHALL autorizar la carga concediendo un permiso temporal para escribir en el
almacenamiento, y el navegador SHALL enviar el archivo directamente allí. El servidor SHALL NOT
recibir, retransmitir ni almacenar el contenido del archivo.

#### Scenario: Carga autorizada

- **WHEN** un aspirante elige un archivo para adjuntar
- **THEN** el sistema le concede un permiso de escritura temporal, el navegador sube el archivo
  con él, y después el sistema registra que ese documento quedó cargado

#### Scenario: El permiso caduca

- **WHEN** se intenta usar un permiso de carga después de su tiempo de validez
- **THEN** el almacenamiento lo rechaza y el aspirante puede pedir uno nuevo

#### Scenario: El permiso sirve para un solo destino

- **WHEN** se intenta usar un permiso de carga para escribir en un lugar distinto del autorizado
- **THEN** la escritura se rechaza

### Requirement: Solo se aceptan archivos admisibles

El sistema SHALL restringir el tipo y el tamaño de los archivos admitidos, y SHALL comprobarlo
**antes** de conceder el permiso de carga. El tamaño máximo SHALL venir de la configuración.

#### Scenario: Archivo de un tipo no admitido

- **WHEN** un aspirante intenta adjuntar un archivo cuyo tipo no está entre los admitidos
- **THEN** no se concede permiso de carga y se le indica qué tipos se aceptan

#### Scenario: Archivo demasiado grande

- **WHEN** un aspirante intenta adjuntar un archivo que supera el tamaño máximo
- **THEN** no se concede permiso de carga y se le indica el tamaño máximo permitido

#### Scenario: El límite es configurable

- **WHEN** se cambia el tamaño máximo en la configuración y se reinicia el sistema
- **THEN** el nuevo límite rige para las cargas siguientes

### Requirement: Los documentos son privados

Un documento adjunto SHALL ser accesible únicamente para su dueño y para quien revise su
inscripción. El almacenamiento SHALL NOT exponerlos públicamente, y el acceso SHALL concederse por
un tiempo acotado cada vez que haga falta.

#### Scenario: El dueño consulta su documento

- **WHEN** un aspirante quiere ver un documento que adjuntó
- **THEN** el sistema le concede un acceso temporal y puede verlo

#### Scenario: Otro aspirante intenta verlo

- **WHEN** un aspirante intenta acceder a un documento de la inscripción de otro
- **THEN** la operación se rechaza sin revelar si ese documento existe

#### Scenario: La dirección del documento no es adivinable ni permanente

- **WHEN** alguien obtiene la dirección con la que se accedió a un documento y la usa más tarde
- **THEN** el acceso ya no es válido

#### Scenario: El almacenamiento no es público

- **WHEN** se intenta acceder al almacenamiento sin un permiso concedido por el sistema
- **THEN** el acceso se rechaza

### Requirement: Los documentos quedan congelados al enviar

Mientras la inscripción sea editable, sus documentos SHALL poder sustituirse. Una vez enviada,
SHALL NOT poder cambiarse hasta que un rechazo la devuelva a estado editable.

#### Scenario: Sustitución con la inscripción enviada

- **WHEN** un aspirante intenta cambiar un documento de una inscripción ya enviada
- **THEN** la operación se rechaza y el documento anterior se conserva

#### Scenario: Sustitución tras un rechazo

- **WHEN** un aspirante cuya inscripción fue rechazada por un documento ilegible adjunta uno nuevo
- **THEN** el nuevo reemplaza al anterior y puede volver a enviar

