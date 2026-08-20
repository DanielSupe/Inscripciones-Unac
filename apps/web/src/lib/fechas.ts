/**
 * Fecha y hora en la hora local de Colombia.
 *
 * Se fija la zona en vez de usar la del navegador: la entrevista ocurre en
 * Medellín, y a un aspirante que viaja o tiene mal el reloj del portátil
 * decirle otra hora sería peor que no decirle ninguna. Colombia no tiene
 * cambio estacional, así que la conversión es estable todo el año.
 */
const FECHA_HORA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  dateStyle: 'full',
  timeStyle: 'short',
});

export function fechaHoraColombia(iso: string): string {
  return FECHA_HORA.format(new Date(iso));
}

const SOLO_FECHA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  dateStyle: 'medium',
});

export function fechaColombia(iso: string): string {
  return SOLO_FECHA.format(new Date(iso));
}

/**
 * Colombia está siempre en UTC-5: no tiene horario de verano.
 *
 * Eso permite convertir sin ambigüedad lo que el decano escribe en un campo de
 * fecha y hora, que el navegador entrega en hora local. Interpretarlo como hora
 * del navegador haría que un decano de viaje agendara a una hora distinta de la
 * que escribió.
 */
const OFFSET_COLOMBIA = '-05:00';

/** De lo que teclea un campo `datetime-local` a un instante absoluto. */
export function isoDesdeHoraColombia(local: string): string {
  return new Date(`${local}:00${OFFSET_COLOMBIA}`).toISOString();
}

const PARTES_BOGOTA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** El camino de vuelta, para rellenar el campo al reagendar. */
export function horaColombiaParaInput(iso: string): string {
  const partes = PARTES_BOGOTA.formatToParts(new Date(iso));
  const parte = (tipo: string): string => partes.find((p) => p.type === tipo)?.value ?? '00';
  return `${parte('year')}-${parte('month')}-${parte('day')}T${parte('hour')}:${parte('minute')}`;
}
