// src/hooks/useBodyScrollLock.js
import { useEffect } from 'react';

// Contador de bloqueos activos: si dos capas (menú + modal) se solapan, el
// primero que se cierre no debe desbloquear el scroll del otro.
let lockCount = 0;
let savedScrollY = 0;
let savedStyles = null;

const applyLock = () => {
  savedScrollY = window.scrollY;
  const body = document.body;
  savedStyles = {
    position: body.style.position,
    top: body.style.top,
    width: body.style.width,
    overflow: body.style.overflow,
  };

  // En iOS `overflow: hidden` no basta: hay que fijar el body. Se guarda el
  // scroll para restaurarlo y que la página no salte al cerrar.
  body.style.position = 'fixed';
  body.style.top = `-${savedScrollY}px`;
  body.style.width = '100%';
  body.style.overflow = 'hidden';
};

const releaseLock = () => {
  const body = document.body;
  if (savedStyles) {
    body.style.position = savedStyles.position;
    body.style.top = savedStyles.top;
    body.style.width = savedStyles.width;
    body.style.overflow = savedStyles.overflow;
    savedStyles = null;
  }
  window.scrollTo({ top: savedScrollY, left: 0, behavior: 'instant' });
};

/**
 * Bloquea el scroll del fondo mientras `locked` sea true (modales, menú móvil,
 * paneles laterales). Compatible con iOS Safari y con capas anidadas.
 */
export const useBodyScrollLock = (locked) => {
  useEffect(() => {
    if (!locked) return;

    lockCount += 1;
    if (lockCount === 1) applyLock();

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) releaseLock();
    };
  }, [locked]);
};
