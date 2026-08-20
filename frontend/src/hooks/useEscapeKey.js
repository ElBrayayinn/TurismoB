// src/hooks/useEscapeKey.js
import { useEffect } from 'react';

/**
 * Ejecuta `handler` al pulsar Escape mientras `active` sea true.
 * Se usa para cerrar modales, menús y paneles laterales con el teclado.
 */
export const useEscapeKey = (active, handler) => {
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') handler();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, handler]);
};
