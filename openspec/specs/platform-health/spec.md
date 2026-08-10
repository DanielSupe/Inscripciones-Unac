# platform-health Specification

## Purpose
Expone si el servicio está operativo y si puede comunicarse con su base de datos, para poder
verificar un despliegue y diagnosticar una caída sin necesidad de abrir la base de datos ni de
tener una cuenta en la plataforma.
## Requirements
### Requirement: El sistema reporta su estado operativo

El API SHALL exponer un punto de consulta público que informe si el servicio está operativo y
si su conexión con la base de datos está funcionando. La comprobación de la base de datos
SHALL ser real, es decir, SHALL ejecutar una consulta contra ella y no limitarse a asumir que
la conexión sigue viva.

#### Scenario: Servicio y base de datos operativos

- **WHEN** se consulta el estado del sistema y la base de datos responde
- **THEN** la respuesta es satisfactoria e indica que tanto el servicio como la base de datos
  están operativos

#### Scenario: Base de datos inalcanzable

- **WHEN** se consulta el estado del sistema mientras la base de datos está caída o no acepta
  conexiones
- **THEN** la respuesta indica que el sistema no está plenamente operativo y señala la base de
  datos como el componente afectado, con un código de estado que permita a un supervisor
  externo detectar la degradación automáticamente

#### Scenario: La consulta es pública

- **WHEN** se consulta el estado del sistema sin ninguna sesión iniciada
- **THEN** la consulta se atiende con normalidad, dado que este punto es accesible para todos
  los roles y también sin autenticar

#### Scenario: La comprobación no bloquea indefinidamente

- **WHEN** la base de datos no responde ni acepta ni rechaza la conexión
- **THEN** la consulta de estado termina de todas formas en un tiempo acotado y reporta la
  degradación, en lugar de quedarse esperando

### Requirement: El estado no revela información sensible

La respuesta de estado SHALL NOT incluir cadenas de conexión, credenciales, nombres de host
internos, rutas del sistema de archivos ni trazas de error.

#### Scenario: Respuesta con la base de datos caída

- **WHEN** la base de datos está caída y se consulta el estado del sistema
- **THEN** la respuesta indica la degradación sin incluir la cadena de conexión, el host, el
  usuario de base de datos ni la traza del error subyacente

### Requirement: El frontend muestra el estado del API

El frontend SHALL consultar el estado del API y presentárselo a la persona que lo abre,
distinguiendo de forma legible entre la carga en curso, el sistema operativo y el sistema
inalcanzable o degradado.

#### Scenario: El API responde

- **WHEN** se abre el frontend y el API está operativo
- **THEN** la pantalla muestra que el sistema está operativo, incluido el estado de la base de
  datos

#### Scenario: El API está inalcanzable

- **WHEN** se abre el frontend y el API no responde
- **THEN** la pantalla muestra un mensaje de error legible en español, y no queda en blanco ni
  se queda cargando de forma indefinida

#### Scenario: Consulta en curso

- **WHEN** se abre el frontend y la consulta al API todavía no ha terminado
- **THEN** la pantalla indica que está cargando

