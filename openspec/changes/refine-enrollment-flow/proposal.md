## Why

El ciclo funciona de punta a punta, y usarlo deja cuatro cosas a la vista.

Abrir un documento adjunto desde la revisión **muestra un bloque de JSON** en lugar del archivo:
el enlace apunta al endpoint que devuelve la dirección firmada, no al documento. Es un defecto
del change anterior y hace la revisión inservible en la práctica, porque quien revisa no puede
ver lo que tiene que juzgar.

El paso de datos académicos **pide de nuevo lo que ya viene en el documento adjunto**: el
registro y el puntaje del ICFES están impresos en el certificado que el aspirante sube. Teclear
lo mismo dos veces solo añade un paso donde equivocarse.

Falta un documento que la universidad sí exige: el **diploma de bachiller**.

Y el wizard, aunque funciona, se ve estrecho y desangelado para lo que es —el trámite más
importante que hace un aspirante en la plataforma—.

## What Changes

- Se añade un **visor de documentos dentro de la propia página**, para el administrador y para
  el aspirante, con la opción de descargar. Deja de abrirse una pestaña con JSON.
- Se **elimina el paso de datos académicos** y sus cuatro campos. El wizard pasa de cuatro pasos
  a tres: datos personales, aspiración y documentos.
- Se añade el **diploma de bachiller** como tercer documento exigido.
- Se **rediseña la inscripción**: los mismos pasos, con más espacio y un tratamiento visual
  acorde a lo que es.

## Fuera de alcance

- No se toca la máquina de estados, ni la revisión, ni el recibo.
- No se rediseña el resto de la aplicación: solo la inscripción.
- El visor no edita, ni rota, ni anota documentos. Muestra y descarga.

## Capabilities

### Modified Capabilities

- `enrollment-submission`: el wizard tenía cuatro pasos y pasa a tener tres. Desaparecen el
  colegio de origen, el año de graduación, el registro ICFES y el puntaje ICFES.
- `enrollment-documents`: pasan de exigirse dos documentos a tres, y se añade la previsualización
  dentro de la aplicación.

## Impact

- **Roles**: APPLICANT ve un formulario más corto, con un documento más y con la posibilidad de
  comprobar lo que subió. ADMIN por fin puede leer los documentos que revisa.
- **Base de datos**: una migración que **elimina cuatro columnas** de la inscripción y añade un
  valor al catálogo de tipos de documento. Los datos de esas columnas se pierden; hoy solo
  contienen pruebas.
- **Configuración**: ninguna variable nueva.
- **Dependencias nuevas**: ninguna. El visor se apoya en lo que el navegador ya sabe mostrar.
- **Inscripciones existentes**: las que ya estuvieran enviadas sin diploma **dejan de estar
  completas** según la regla nueva. Ver Riesgos en `design.md`.

## Supuestos

- El aspirante puede ver sus propios documentos mientras la inscripción sea editable, que es
  cuando todavía puede corregirlos, y también después.
- Los tipos admitidos siguen siendo PDF, JPG y PNG, así que el visor solo tiene que saber mostrar
  esos tres.
- Eliminar las columnas académicas es aceptable porque la información sigue existiendo donde de
  verdad importa: en el certificado del ICFES que el aspirante adjunta.
