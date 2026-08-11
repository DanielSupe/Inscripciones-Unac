import { useState } from 'react';
import type { AttachmentType } from '@repo/contracts';

/**
 * Estado compartido por las pantallas que abren el visor.
 *
 * Vive aparte del componente porque mezclar hooks y componentes en el mismo
 * archivo rompe la recarga en caliente de React.
 */
export function useDocumentViewer() {
  const [abierto, setAbierto] = useState<AttachmentType | null>(null);

  return {
    abierto,
    abrir: (type: AttachmentType) => {
      setAbierto(type);
    },
    cerrar: () => {
      setAbierto(null);
    },
  };
}
