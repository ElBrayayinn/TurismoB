// src/hooks/useDarkMode.js
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'darkMode';

// Mantiene la barra del navegador (Android/Chrome) en sintonía con el tema.
const syncThemeColor = (isDark) => {
  const color = isDark ? '#0C0E1A' : '#faf8ff';
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', color));
};

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEY, 'true');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY, 'false');
    }
    syncThemeColor(isDark);
  }, [isDark]);

  // Si el usuario nunca eligió manualmente, seguir la preferencia del sistema.
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setIsDark(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const toggleDark = () => setIsDark((prev) => !prev);

  return [isDark, toggleDark];
};

/**
 * Solo lectura: indica si el tema oscuro está activo observando la clase
 * `dark` en <html>. Lo usan los componentes de mapa, que necesitan pasar el
 * esquema de color a Google Maps sin poder alterar el tema.
 */
export const useIsDarkTheme = () => {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
};
