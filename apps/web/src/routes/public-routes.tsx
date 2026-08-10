import { Link } from '@tanstack/react-router';
import { HealthPanel } from '../features/health/components/health-panel';
import { LoginForm } from '../features/auth/components/login-form';
import { RegisterForm } from '../features/auth/components/register-form';

/** Portada pública. Mantiene visible el estado del sistema. */
export function PublicHome() {
  return (
    <main className="pagina">
      <header>
        <h1>SION</h1>
        <p className="subtitulo">Inscripciones · Universidad Adventista de Colombia</p>
      </header>

      <div className="acciones">
        <Link to="/ingresar" className="boton boton--primario">
          Ingresar
        </Link>
        <Link to="/registro" className="boton">
          Crear cuenta
        </Link>
      </div>

      <section aria-labelledby="titulo-estado">
        <h2 id="titulo-estado">Estado del sistema</h2>
        <HealthPanel />
      </section>
    </main>
  );
}

export function LoginPage() {
  return (
    <main className="pagina pagina--estrecha">
      <LoginForm />
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
