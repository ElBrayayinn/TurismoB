// src/hooks/useMediaQuery.js
import { useCallback, useSyncExternalStore } from 'react';

const noopSubscribe = () => () => {};

/**
 * Suscribe un componente a una media query y devuelve si se cumple.
 *
 * Sustituye a leer `window.innerWidth` durante el render: ese valor NO es
 * reactivo, así que al rotar el móvil o cambiar el tamaño de la ventana el
 * componente se quedaba con la rama equivocada (móvil/escritorio) hasta que
 * algo más lo re-renderizaba.
 *
 * Se implementa con useSyncExternalStore, la API de React pensada justo para
 * leer un sistema externo sin desincronizaciones ni renders en cascada.
 *
 * @param {string} query - p. ej. '(max-width: 768px)'
 * @returns {boolean}
 */
export const useMediaQuery = (query) => {
  const supported = typeof window !== 'undefined' && !!window.matchMedia;

  const subscribe = useCallback(
    (onChange) => {
      if (!supported) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query, supported]
  );

  const getSnapshot = useCallback(
    () => (supported ? window.matchMedia(query).matches : false),
    [query, supported]
  );

  return useSyncExternalStore(
    supported ? subscribe : noopSubscribe,
    getSnapshot,
    () => false
  );
};

// Puntos de quiebre del sistema de diseño (ver estilos/variables.css).
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsSmallMobile = () => useMediaQuery('(max-width: 480px)');
export const useIsTablet = () => useMediaQuery('(max-width: 1024px)');
export const usePrefersReducedMotion = () =>
  useMediaQuery('(prefers-reduced-motion: reduce)');
