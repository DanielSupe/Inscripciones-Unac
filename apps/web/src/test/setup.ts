import '@testing-library/jest-dom/vitest';

/**
 * jsdom no implementa `matchMedia`, y sin ella cualquier componente que
 * consulte una preferencia del sistema revienta al montarse. El valor por
 * defecto es «no reducir movimiento»; la prueba que necesite lo contrario
 * sustituye esta implementación.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}
