## ADDED Requirements

### Requirement: Avance por facultad en el tablero

El tablero del panel de administración SHALL mostrar, para cada facultad activa, cuántos
matriculados lleva y, si tiene meta, dónde está esa meta, sobre una escala común a todas las
facultades para que se puedan comparar entre sí. Cada facultad SHALL mostrar sus cifras escritas
como texto, no solo como longitud de barra.

Una facultad sin meta SHALL aparecer igualmente, con sus matriculados y marcada como sin meta.

#### Scenario: Facultad con meta

- **WHEN** una facultad activa tiene meta 120 y 84 matriculados
- **THEN** el tablero la muestra con su barra de matriculados, la marca de su meta y el texto
  «84 de 120»

#### Scenario: Facultad sin meta

- **WHEN** una facultad activa no tiene meta y lleva 31 matriculados
- **THEN** el tablero la muestra con su barra y el texto «31 · sin meta», sin marca de meta

#### Scenario: Facultad que superó su meta

- **WHEN** una facultad tiene meta 40 y 52 matriculados
- **THEN** su barra pasa la marca de la meta y la escala se amplía para que ninguna barra se corte

#### Scenario: Error al cargar el avance por facultad

- **WHEN** falla la consulta del avance por facultad
- **THEN** ese bloque anuncia el error de forma accesible y el resto del tablero sigue visible
