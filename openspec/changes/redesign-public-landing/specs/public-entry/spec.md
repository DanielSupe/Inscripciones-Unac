# public-entry Specification

## Purpose

Describe qué encuentra y qué puede hacer quien llega a la plataforma sin haber iniciado sesión.
Es la única pantalla que ve alguien que todavía no tiene cuenta, así que carga con dos trabajos
a la vez: dejar entrar a quien ya la tiene y presentar la institución a quien no.

## ADDED Requirements

### Requirement: Se puede ingresar sin navegar

La pantalla pública inicial SHALL presentar el formulario de ingreso, de modo que quien llega
sin sesión pueda escribir sus credenciales sin abrir antes ninguna otra pantalla.

Quien llega a esa misma dirección **con una sesión válida** SHALL ser llevado a la pantalla
inicial de su rol —APPLICANT, STUDENT o ADMIN—, porque pedir credenciales a quien ya está
identificado no tiene sentido.

#### Scenario: Visitante sin sesión

- **WHEN** alguien sin sesión abre la dirección inicial de la plataforma
- **THEN** ve el formulario de ingreso y puede enviarlo desde ahí mismo

#### Scenario: Ingreso correcto desde la pantalla inicial

- **WHEN** se envía el formulario con las credenciales de una cuenta existente
- **THEN** la sesión queda iniciada y la persona llega a la pantalla inicial que corresponde a
  su rol

#### Scenario: Credenciales incorrectas

- **WHEN** se envía el formulario con credenciales que no corresponden a ninguna cuenta activa
- **THEN** se anuncia un mensaje neutro que no permite distinguir si el correo existe, y la
  persona permanece en la pantalla con lo que escribió

#### Scenario: Alguien que ya tiene sesión

- **WHEN** una persona con sesión válida abre la dirección inicial
- **THEN** es llevada a la pantalla inicial de su rol, sin ver el formulario de ingreso

### Requirement: Hay un solo lugar donde ingresar

Toda ruta de la plataforma que conduzca a iniciar sesión SHALL desembocar en la pantalla
pública inicial. El sistema SHALL NOT mantener dos pantallas distintas donde ingresar.

Los avisos que acompañan a esos caminos —sesión caducada, cuenta recién creada— SHALL seguir
mostrándose al llegar, y SHALL mostrarse una sola vez: recargar la pantalla no vuelve a
anunciarlos.

#### Scenario: Cierre de sesión

- **WHEN** una persona cierra su sesión
- **THEN** llega a la pantalla pública inicial con el formulario de ingreso a la vista

#### Scenario: Sesión caducada

- **WHEN** una sesión caduca y la persona es devuelta a la zona pública
- **THEN** llega a la pantalla inicial y se le anuncia que su sesión caducó

#### Scenario: Registro recién completado

- **WHEN** alguien termina de crear su cuenta
- **THEN** llega a la pantalla inicial y se le anuncia que su cuenta quedó creada

#### Scenario: El aviso no se repite

- **WHEN** se recarga la pantalla inicial después de haber visto uno de esos avisos
- **THEN** el aviso ya no aparece

### Requirement: La pantalla presenta a la institución

La pantalla pública inicial SHALL identificar a la plataforma por su logotipo y SHALL presentar
los valores de la institución.

Los valores SHALL mostrarse como contenido, no como accesos: SHALL NOT conducir a ninguna otra
pantalla ni comportarse como controles que puedan activarse.

El logotipo SHALL servirse desde la propia plataforma, sin depender de un dominio ajeno, y SHALL
ofrecer un texto alternativo para quien no puede verlo.

#### Scenario: Identidad visible

- **WHEN** se abre la pantalla inicial
- **THEN** se ve el logotipo de la plataforma con su texto alternativo

#### Scenario: Los valores se leen, no se pulsan

- **WHEN** se recorre la pantalla inicial con el teclado
- **THEN** los valores institucionales se pueden leer pero no reciben foco como si fueran
  enlaces o botones

### Requirement: La pantalla incluye un carrusel de piezas institucionales

La pantalla pública inicial SHALL incluir un carrusel donde mostrar piezas institucionales.

Con **dos o más piezas**, el carrusel SHALL avanzar solo cada cierto tiempo, SHALL permitir
avanzar y retroceder, SHALL permitir saltar a una pieza concreta, y SHALL indicar cuál se está
viendo. El avance automático SHALL detenerse mientras el puntero esté encima o mientras alguno
de sus controles tenga el foco, para no arrebatarle a nadie lo que estaba mirando.

El carrusel SHALL respetar la preferencia del sistema de **reducir el movimiento**: cuando esté
activa, SHALL NOT avanzar solo, y SHALL seguir siendo navegable con sus controles.

**Sin piezas que mostrar**, el carrusel SHALL ocupar su espacio sin presentar controles que no
lleven a ninguna parte, y SHALL NOT anunciar contenido inexistente.

#### Scenario: Avance automático

- **WHEN** el carrusel tiene varias piezas y nadie interactúa con él
- **THEN** la pieza visible cambia sola cada cierto tiempo

#### Scenario: Navegación manual

- **WHEN** se usan los controles de avanzar, retroceder o saltar a una pieza
- **THEN** se muestra la pieza pedida y se indica cuál es

#### Scenario: El movimiento no interrumpe

- **WHEN** el puntero está sobre el carrusel o uno de sus controles tiene el foco
- **THEN** el avance automático se detiene mientras dure esa situación

#### Scenario: Preferencia de movimiento reducido

- **WHEN** el sistema de quien visita pide reducir el movimiento
- **THEN** el carrusel no avanza solo, y sus controles siguen funcionando

#### Scenario: Carrusel vacío

- **WHEN** el carrusel no tiene ninguna pieza configurada
- **THEN** la pantalla se presenta completa y sin controles de navegación del carrusel

### Requirement: La contraseña escrita se puede comprobar

El campo de contraseña de la pantalla inicial SHALL empezar oculto y SHALL ofrecer un control
para revelar y volver a ocultar lo escrito. Ese control SHALL comunicar en qué estado se
encuentra, de modo que también lo sepa quien no ve la pantalla.

#### Scenario: Revelar y volver a ocultar

- **WHEN** se activa el control de revelar y después se activa de nuevo
- **THEN** la contraseña se muestra legible y vuelve a quedar oculta, y el control refleja cada
  estado

### Requirement: La pantalla no ofrece lo que el sistema no hace

La pantalla pública inicial SHALL NOT presentar controles ni enlaces para comportamientos que la
plataforma no implementa. En particular SHALL NOT ofrecer mantener la sesión abierta más allá de
su duración configurada, ni recuperar la contraseña por cuenta propia, que solo un ADMIN puede
restablecer.

#### Scenario: Sin promesas vacías

- **WHEN** se recorre la pantalla inicial
- **THEN** todos sus controles producen un efecto real, y no aparece ninguno para conservar la
  sesión ni para recuperar la contraseña

### Requirement: El estado del sistema sigue consultándose desde la zona pública

La pantalla pública inicial SHALL seguir mostrando si la plataforma está operativa, sin requerir
sesión. La indicación SHALL distinguir el estado operativo del degradado, y SHALL NOT revelar
detalles de la infraestructura.

#### Scenario: Plataforma operativa

- **WHEN** se abre la pantalla inicial y el sistema responde con normalidad
- **THEN** se indica que la plataforma está operativa

#### Scenario: Plataforma degradada

- **WHEN** se abre la pantalla inicial y el sistema no está plenamente operativo
- **THEN** se indica la degradación sin nombrar servidores, cadenas de conexión ni errores
  internos
