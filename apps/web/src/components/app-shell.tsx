import { Link, Outlet, useRouter } from '@tanstack/react-router';
import type { SessionUser } from '@repo/contracts';
import { useLogout } from '../features/auth/api/auth-queries';
import { NAV_BY_ROLE, ROLE_LABELS } from './navigation';

/**
 * Marco común de la zona autenticada: header arriba, menú lateral a la
 * izquierda y el contenido de la ruta activa a la derecha.
 *
 * Es una ruta de layout, no un componente que cada página repita: así el guard
 * de sesión vive en un solo sitio y las páginas hijas solo aportan contenido.
 */
export function AppShell({ session }: { session: SessionUser }) {
  const router = useRouter();
  const logout = useLogout();
  const items = NAV_BY_ROLE[session.role];

  async function handleLogout() {
    await logout.mutateAsync();
    await router.navigate({ to: '/ingresar' });
  }

  return (
    <div className="shell">
      <a className="salto" href="#contenido">
        Saltar al contenido
      </a>

      <header className="shell__header">
        <span className="marca">
          SION <span className="marca__sub">· Inscripciones UNAC</span>
        </span>

        <div className="usuario">
          <span className="usuario__correo">{session.email}</span>
          <span className="etiqueta-rol">{ROLE_LABELS[session.role]}</span>
          <button type="button" onClick={() => void handleLogout()} disabled={logout.isPending}>
            {logout.isPending ? 'Saliendo…' : 'Salir'}
          </button>
        </div>
      </header>

      <div className="shell__cuerpo">
        <nav className="lateral" aria-label="Secciones">
          <p className="lateral__titulo">{ROLE_LABELS[session.role]}</p>
          <ul>
            {items.map((item) => (
              <li key={item.label}>
                {item.to ? (
                  <Link to={item.to} activeProps={{ 'aria-current': 'page' }}>
                    {item.label}
                  </Link>
                ) : (
                  // Sin destino todavía. Se anuncia como deshabilitada para que
                  // un lector de pantalla no la ofrezca como si fuera pulsable.
                  <span className="lateral__pronto" aria-disabled="true">
                    {item.label}
                    <em>pronto</em>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <main className="contenido" id="contenido">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
