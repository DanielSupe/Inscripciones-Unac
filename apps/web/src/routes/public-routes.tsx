import { Link } from '@tanstack/react-router';
import { Carousel, type CarouselSlide } from '../components/carousel';
import { InstitutionalValues } from '../components/institutional-values';
import { HealthBadge } from '../features/health/components/health-badge';
import { LoginForm } from '../features/auth/components/login-form';
import { RegisterForm } from '../features/auth/components/register-form';

/**
 * Piezas del carrusel.
 *
 * Vacío a propósito: el soporte está construido y espera el material de la
 * institución. Rellenarlo con imágenes de muestra obligaría a acordarse de
 * quitarlas, y mientras tanto la pantalla afirmaría cosas que la UNAC no dijo.
 */
const PIEZAS: CarouselSlide[] = [];

/**
 * Pantalla de entrada.
 *
 * El ingreso va **primero en el marcado** aunque en pantalla ancha se pinte a
 * la derecha: es a lo que viene la mayoría, y en un móvil hacerle recorrer
 * antes el carrusel y los valores sería ordenar la pantalla al revés de como se
 * usa. La rejilla lo coloca en su columna sin alterar ese orden.
 */
export function PublicHome() {
  return (
    <main className="entrada">
      <section className="entrada__acceso">
        <img
          className="entrada__logo"
          src="/sion-logo.png"
          alt="SION"
          width={234}
          height={120}
        />
        <LoginForm />
      </section>

      <section className="entrada__vitrina" aria-label="La Universidad Adventista de Colombia">
        <Carousel slides={PIEZAS} label="Novedades de la universidad" />

        <div className="entrada__banda">
          <InstitutionalValues />

          <footer className="entrada__pie">
            <p className="entrada__creditos">
              © {new Date().getFullYear()} Universidad Adventista de Colombia · SION
            </p>
            <HealthBadge />
          </footer>
        </div>
      </section>
    </main>
  );
}

export function RegisterPage() {
  return (
    <main className="pagina pagina--estrecha">
      <RegisterForm />
    </main>
  );
}

/**
 * Texto de las políticas de tratamiento de datos.
 *
 * La versión vigente la fija la configuración del servidor, que es la que se
 * guarda con cada registro. Al cambiar este texto hay que subir esa versión.
 */
export function PoliciesPage() {
  return (
    <main className="pagina">
      <h1>Políticas de tratamiento de datos personales</h1>
      <p className="subtitulo">Ley 1581 de 2012</p>

      <section className="prosa">
        <h2>Responsable</h2>
        <p>
          La Universidad Adventista de Colombia es responsable del tratamiento de los datos
          personales que recoge a través de la plataforma SION.
        </p>

        <h2>Finalidad</h2>
        <p>
          Los datos se recogen para adelantar el proceso de inscripción y admisión, verificar la
          identidad del aspirante, comunicar el resultado del proceso y generar el recibo de pago
          correspondiente.
        </p>

        <h2>Datos que se recogen</h2>
        <p>
          Documento de identidad, correo electrónico y, en el momento de la inscripción, datos
          personales, académicos y de la aspiración al programa elegido.
        </p>

        <h2>Derechos del titular</h2>
        <p>
          Puedes conocer, actualizar y rectificar tus datos personales, solicitar prueba de esta
          autorización, y revocarla o solicitar la supresión de tus datos cuando no exista un deber
          legal o contractual que lo impida.
        </p>

        <h2>Vigencia</h2>
        <p>
          Los datos se conservarán mientras dure el proceso de inscripción y durante el tiempo que
          exijan las obligaciones legales de la institución.
        </p>
      </section>

      <p>
        <Link to="/registro">Volver al registro</Link>
      </p>
    </main>
  );
}
