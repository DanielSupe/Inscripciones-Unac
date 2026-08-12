/**
 * Valores de la institución.
 *
 * PROVISIONAL — redactados a la espera de los oficiales de la UNAC. Se cambian
 * editando este arreglo: son contenido, no configuración, así que no dependen
 * del entorno ni los administra nadie desde la plataforma.
 *
 * No son enlaces. En la pantalla original de SION este espacio lleva accesos a
 * soporte; aquí es material de lectura, y hacerlo parecer pulsable prometería
 * una navegación que no existe.
 */
const VALORES = [
  {
    id: 'integridad',
    nombre: 'Integridad',
    texto: 'Obramos con honestidad y coherencia, también cuando nadie mira.',
    tinte: 'arena',
  },
  {
    id: 'servicio',
    nombre: 'Servicio',
    texto: 'Nos formamos para aportar a la comunidad, no solo para ocupar un cargo.',
    tinte: 'salvia',
  },
  {
    id: 'excelencia',
    nombre: 'Excelencia',
    texto: 'Buscamos el mejor trabajo posible en lo académico y en lo humano.',
    tinte: 'cielo',
  },
] as const;

export function InstitutionalValues() {
  return (
    <section className="valores" aria-labelledby="titulo-valores">
      <h2 id="titulo-valores" className="valores__titulo">
        Nuestros valores
      </h2>

      <ul className="valores__lista">
        {VALORES.map((valor) => (
          <li key={valor.id} className="valores__ficha">
            <span className={`valores__marca valores__marca--${valor.tinte}`} aria-hidden="true">
              {valor.nombre.charAt(0)}
            </span>
            <h3 className="valores__nombre">{valor.nombre}</h3>
            <p className="valores__texto">{valor.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
