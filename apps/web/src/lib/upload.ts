/**
 * Sube un archivo al almacenamiento con un permiso ya firmado por el API.
 *
 * Vive en `lib/` por dos motivos. Uno, es la única llamada de red del frontend
 * que **no** va a nuestro API: va directa al bucket, y por eso no lleva las
 * credenciales de sesión ni pasa por el cliente HTTP. Dos, la regla de ESLint
 * que prohíbe `fetch` fuera de aquí no debe saltarse desde un componente.
 *
 * El tipo de contenido tiene que coincidir exactamente con el que se declaró al
 * pedir el permiso: la firma lo incluye, así que enviarlo distinto hace que el
 * almacenamiento rechace la subida.
 */
export async function uploadToStorage(url: string, file: File): Promise<void> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
  } catch {
    throw new Error(
      'No se pudo subir el archivo. Revisa tu conexión e inténtalo de nuevo.',
    );
  }

  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? 'El permiso de subida caducó. Vuelve a intentarlo.'
        : 'El almacenamiento rechazó el archivo. Inténtalo de nuevo.',
    );
  }
}
