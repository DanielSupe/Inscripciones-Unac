import { HealthPanel } from '../features/health/components/health-panel';

export function HomePage() {
  return (
    <main className="pagina">
      <header>
        <h1>SION</h1>
        <p className="subtitulo">Inscripciones · Universidad Adventista de Colombia</p>
      </header>

      <section aria-labelledby="titulo-estado">
        <h2 id="titulo-estado">Estado del sistema</h2>
        <HealthPanel />
      </section>

      <footer className="aviso">
        <p>
          Esta versión solo monta la base técnica del proyecto. Todavía no existe registro de
          cuenta ni inicio de sesión.
        </p>
      </footer>
    </main>
  );
}
