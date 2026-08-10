## MODIFIED Requirements

### Requirement: El rol se toma siempre de la sesión del servidor

El sistema SHALL determinar el rol de quien pide algo exclusivamente a partir de su sesión.
SHALL NOT aceptar el rol, el identificador de usuario ni ninguna otra marca de privilegio desde
el cuerpo, los parámetros o las cabeceras de la petición.

Cuando una operación recaiga sobre un dato que pertenece a una persona concreta, el rol no
alcanza: el sistema SHALL comprobar además que ese dato pertenece a quien lo pide, y SHALL
hacerlo antes de devolver nada sobre él. Que la interfaz no ofrezca el camino no cuenta como
comprobación.

#### Scenario: La petición declara su propio rol

- **WHEN** una persona con rol APPLICANT envía en su petición un campo que dice que es ADMIN
- **THEN** el sistema la trata como APPLICANT y el campo enviado se ignora

#### Scenario: La petición suplanta a otra persona

- **WHEN** una petición incluye el identificador de otra cuenta con la intención de actuar en
  su nombre
- **THEN** la operación se resuelve sobre la cuenta de la sesión, no sobre la indicada

#### Scenario: Se pide un dato ajeno del mismo tipo

- **WHEN** un aspirante pide, modifica o elimina un dato que pertenece a otro aspirante,
  indicando su identificador directamente
- **THEN** la operación se rechaza sin revelar si ese dato existe, y no produce ningún efecto

#### Scenario: Dos personas del mismo rol no ven lo mismo

- **WHEN** dos aspirantes distintos consultan la misma clase de recurso
- **THEN** cada uno obtiene únicamente lo suyo, aunque ambos tengan idéntico rol
