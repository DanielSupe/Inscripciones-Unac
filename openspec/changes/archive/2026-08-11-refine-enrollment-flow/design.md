## Context

Ver `proposal.md` — Why. Este change nace de usar el producto terminado, no de planificarlo: son
cuatro correcciones que solo se ven cuando alguien recorre el trámite de verdad.

## Goals / Non-Goals

**Goals:**

- Que quien revisa pueda ver lo que revisa.
- Que la inscripción pida una sola vez cada cosa.
- Que el trámite se vea como lo que es.

**Non-Goals:**

- No se rediseña el resto de la aplicación. El marco, el ingreso y la consola se quedan como
  están: mezclar un rediseño general con estos arreglos haría imposible saber qué rompió qué.
- El visor no edita ni anota. Muestra y descarga.

## Decisions

### El visor pide la dirección firmada y la usa dentro de la página

El defecto actual es un enlace directo al endpoint que **devuelve** la dirección, en lugar de
usarla:

```
✗  <a href=".../documents/IDENTITY/url">   → el navegador muestra {"url": "..."}
✓  pedir la dirección  →  mostrarla en un visor dentro de la página
```

El visor pide la dirección al abrirse, no antes: firmar por adelantado los documentos de una
lista gastaría firmas que probablemente nadie use, y cada una tiene una vida corta que empezaría
a correr desde que se pintó la pantalla.

Se muestra según el tipo: los PDF en un marco embebido, las imágenes como imagen. Cualquier otro
tipo cae en la opción de descarga, que es lo que exige la spec en vez de un visor vacío.

La dirección firmada nunca se enseña. Vive en el estado del componente y muere al cerrarlo.

Alternativa descartada: que el API entregue el archivo haciendo de intermediario. Volvería a
meter el contenido por el backend, que es justo lo que el change anterior evitó por no tener
disco ni ancho de banda para ello.

### Los pasos se derivan de un solo sitio

El wizard pasa de cuatro pasos a tres. La lista de pasos, sus etiquetas y qué campos pertenecen
a cada uno ya viven en `packages/contracts`, así que quitar un paso es quitarlo ahí: el cálculo
de qué falta, la navegación y el mapeo de errores lo siguen sin tocarse.

Es la comprobación de que ese diseño era correcto. Si hubiera que editar cinco archivos para
quitar un paso, estaría mal repartido.

### Las columnas se eliminan, no se dejan muertas

`previousSchool`, `graduationYear`, `icfesRegistration` e `icfesScore` desaparecen del modelo.

Dejarlas nulables y sin uso sería más cauto, pero también sería mentir: cualquiera que lea el
esquema dentro de seis meses supondrá que se llenan. Los únicos datos que hay en ellas hoy son de
prueba.

### El diploma es un valor más del catálogo de tipos

`ATTACHMENT_TYPES` gana `DIPLOMA`, y con él la regla de «faltan documentos» se ajusta sola: el
cálculo compara los adjuntos contra ese catálogo, no contra una lista escrita aparte.

## Modelo de datos

```
Enrollment      − previousSchool, graduationYear, icfesRegistration, icfesScore
AttachmentType  + DIPLOMA
```

Una migración. Destructiva en las cuatro columnas, aditiva en el enum.

## Risks / Trade-offs

- **Las inscripciones ya enviadas quedan incompletas** según la regla nueva, porque nadie adjuntó
  un diploma que no se pedía. → No se les cambia el estado: siguen enviadas y el administrador
  puede aprobarlas. Solo si una se rechaza y vuelve a estado editable se le exigirá el diploma
  para reenviar, que es el momento correcto para pedirlo.
- **La migración borra datos.** → Hoy solo hay pruebas. Si esto ocurriera con datos reales, habría
  que exportarlos antes; queda dicho aquí para que nadie lo repita a ciegas en producción.
- **El visor depende de lo que el navegador sepa mostrar.** Un PDF embebido se comporta distinto
  en cada navegador y en móvil a menudo no se muestra. → Por eso la descarga está siempre
  disponible, no solo cuando el visor falla.
- **El rediseño toca solo la inscripción**, así que durante un tiempo convivirán dos tratamientos
  visuales. → Es deliberado: el resto se alineará después, y mezclarlo aquí impediría saber qué
  cambio rompió qué.

## Migration Plan

Una migración de Prisma que elimina cuatro columnas y añade un valor al enum. La reversión
recrea las columnas vacías; los datos no vuelven.
