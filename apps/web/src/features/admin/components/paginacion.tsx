/** Paginación compartida por la tabla de cuentas y por la bandeja. */
export function Paginacion({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const paginas = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  return (
    <nav className="paginacion" aria-label="Paginación">
      <button type="button" onClick={() => { onChange(page - 1); }} disabled={page <= 1}>
        Anterior
      </button>
      <span>
        Página {page} de {paginas} · {total} en total
      </span>
      <button type="button" onClick={() => { onChange(page + 1); }} disabled={page >= paginas}>
        Siguiente
      </button>
    </nav>
  );
}
