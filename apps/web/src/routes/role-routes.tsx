import type { SessionUser } from '@repo/contracts';

/**
 * Pantallas de destino de cada rol.
 *
 * Son marcadores por ahora: el contenido real llega en los changes de
 * inscripción y de administración. Lo que sí es real es el shell que las
 * envuelve y el guard que decide quién llega a cada una.
 */

function Placeholder({
  titulo,
  descripcion,
  session,
}: {
  titulo: string;
  descripcion: string;
  session: SessionUser;
}) {
  return (
    <>
      <h1>{titulo}</h1>
      <p className="subtitulo">{descripcion}</p>

      <dl className="ficha">
        <dt>Documento</dt>
        <dd>
          {session.documentType} {session.documentNumber}
        </dd>
        <dt>Correo</dt>
        <dd>{session.email}</dd>
      </dl>
    </>
  );
}

export function ApplicantHome({ session }: { session: SessionUser }) {
  return (
    <Placeholder
      titulo="Mi proceso"
      descripcion="Aquí verás el avance de tu inscripción cuando esté disponible."
      session={session}
    />
  );
}

export function StudentHome({ session }: { session: SessionUser }) {
  return (
    <Placeholder
      titulo="Mi inscripción"
      descripcion="Tu inscripción fue aprobada. Aquí podrás consultarla y descargar tu recibo."
      session={session}
    />
  );
}

export function AdminHome({ session }: { session: SessionUser }) {
  return (
    <Placeholder
      titulo="Panel de administración"
      descripcion="Desde aquí gestionarás usuarios, aspirantes y periodos académicos."
      session={session}
    />
  );
}
