// src/componentes/estructura/Header.jsx
import { useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiSunLine, RiMoonLine, RiMenuLine, RiCloseLine } from 'react-icons/ri';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import './Header.css';

const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/calendario', label: 'Calendario' },
  { to: '/pqrs', label: 'PQRS' },
  { to: '/admin', label: 'Administrador' },
];

export const Header = () => {
  const [isDark, toggleDark] = useDarkMode();
  const location = useLocation();

  // El menú guarda la ruta en la que se abrió: así queda cerrado automáticamente
  // al navegar (incluido el botón atrás del navegador), sin efectos ni refs.
  const [menu, setMenu] = useState({ open: false, path: location.pathname });
  const menuOpen = menu.open && menu.path === location.pathname;

  const closeMenu = useCallback(
    () => setMenu((prev) => ({ ...prev, open: false })),
    []
  );

  const toggleMenu = () =>
    setMenu({ open: !menuOpen, path: location.pathname });

  // El menú desplegado bloquea el scroll del fondo y se cierra con Escape.
  useBodyScrollLock(menuOpen);
  useEscapeKey(menuOpen, closeMenu);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="header">
      <a className="skip-link" href="#contenido-principal">Saltar al contenido</a>

      <div className="container header__container">
        <Link to="/" className="header__logo" onClick={closeMenu}>
          {/* Escudo SVG de Itagüí / Icono estilizado */}
          <svg className="header__logo-img" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          <span className="header__title">Turismo Itagüí</span>
        </Link>

        <nav className="header__nav" aria-label="Navegación principal">
          <ul
            id="menu-principal"
            className={`header__nav-list ${menuOpen ? 'header__nav-list--open' : ''}`}
          >
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`header__nav-link ${isActive(to) ? 'header__nav-link--active' : ''}`}
                  aria-current={isActive(to) ? 'page' : undefined}
                  onClick={closeMenu}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="header__controls">
            <button
              className="header__btn"
              onClick={toggleDark}
              aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
              aria-pressed={isDark}
              title={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
            >
              {isDark ? <RiSunLine /> : <RiMoonLine />}
            </button>

            <button
              className="header__btn header__mobile-toggle"
              onClick={toggleMenu}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
              aria-controls="menu-principal"
            >
              {menuOpen ? <RiCloseLine /> : <RiMenuLine />}
            </button>
          </div>
        </nav>
      </div>

      {/* Capa para cerrar el menú tocando fuera (solo móvil). */}
      {menuOpen && (
        <div className="header__backdrop" onClick={closeMenu} aria-hidden="true" />
      )}
    </header>
  );
};
