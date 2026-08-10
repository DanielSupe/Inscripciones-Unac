# runtime-configuration Specification

## Purpose
Centraliza la configuración de las aplicaciones para que ningún valor que dependa del entorno
viva escrito en el código, y para que un despliegue mal configurado falle de inmediato al
arrancar en vez de fallar a mitad de una petición de un usuario real.
## Requirements
### Requirement: La configuración se valida al arrancar

Cada aplicación SHALL declarar el conjunto completo de variables de entorno que necesita, y
SHALL validarlo antes de aceptar tráfico. Si falta una variable requerida o su valor no cumple
el formato esperado, la aplicación SHALL detener el arranque y terminar con un código de
salida distinto de cero.

#### Scenario: Configuración completa y válida

- **WHEN** se inicia una aplicación con todas sus variables requeridas presentes y válidas
- **THEN** la aplicación arranca con normalidad y queda disponible para atender peticiones

#### Scenario: Falta una variable requerida

- **WHEN** se inicia una aplicación sin una variable de entorno requerida
- **THEN** la aplicación no arranca, termina con código distinto de cero, y emite un mensaje
  que nombra explícitamente la variable faltante

#### Scenario: Variable presente con formato inválido

- **WHEN** una variable requerida está presente pero su valor no cumple el formato esperado,
  por ejemplo un puerto que no es un número o una cadena de conexión que no es una URL
- **THEN** la aplicación no arranca y el mensaje nombra la variable e indica qué formato se
  esperaba

#### Scenario: Varias variables inválidas a la vez

- **WHEN** faltan o son inválidas varias variables simultáneamente
- **THEN** el mensaje de error las lista todas en una sola ejecución, de modo que no haya que
  arrancar repetidamente para descubrirlas de una en una

#### Scenario: El error de configuración no filtra secretos

- **WHEN** una variable que contiene un secreto está presente pero es inválida
- **THEN** el mensaje de error nombra la variable pero NO imprime su valor

### Requirement: Ningún valor dependiente del entorno está escrito en el código

El sistema SHALL obtener de su configuración toda URL, puerto, origen permitido, credencial,
secreto o cadena de conexión. Cambiar cualquiera de esos valores SHALL NOT requerir modificar
el código fuente.

#### Scenario: Se cambia la dirección del API sin tocar código

- **WHEN** se cambia el valor de la variable que define la dirección del API y se vuelve a
  construir y desplegar el frontend
- **THEN** el frontend consulta la nueva dirección sin que se haya modificado ningún archivo
  de código fuente

#### Scenario: Se cambia el origen permitido sin tocar código

- **WHEN** se cambia el valor de la variable que define el origen del frontend autorizado y se
  reinicia el API
- **THEN** el API acepta peticiones con credenciales desde el nuevo origen y las rechaza desde
  cualquier otro, sin que se haya modificado ningún archivo de código fuente

#### Scenario: Los secretos no se exponen

- **WHEN** se inspeccionan los registros de la aplicación y las respuestas del API durante el
  arranque y la operación normal
- **THEN** ningún secreto de configuración aparece en ellos

### Requirement: La configuración requerida está documentada y no se versionan secretos

El repositorio SHALL incluir, para cada aplicación, un archivo de ejemplo que enumere todas
sus variables de entorno con un valor de muestra y una descripción breve. El repositorio
SHALL NOT contener archivos de entorno con valores reales.

#### Scenario: Puesta en marcha de un desarrollador nuevo

- **WHEN** una persona clona el repositorio, copia cada archivo de ejemplo a su archivo de
  entorno correspondiente y levanta los servicios locales
- **THEN** ambas aplicaciones arrancan sin necesidad de averiguar variables adicionales no
  documentadas

#### Scenario: No hay secretos versionados

- **WHEN** se inspecciona el contenido versionado del repositorio
- **THEN** no existe ningún archivo de entorno con valores reales, y los archivos de entorno
  locales están excluidos del control de versiones

#### Scenario: Una variable nueva llega documentada

- **WHEN** un cambio introduce una variable de entorno requerida
- **THEN** el archivo de ejemplo de la aplicación afectada la incluye en el mismo cambio

