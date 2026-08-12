// src/paginas/NotFound.jsx
import { Link } from 'react-router-dom';
import { RiCompass3Line } from 'react-icons/ri';
import './NotFound.css';

export const NotFound = () => (
  <div className="notfound container">
    <RiCompass3Line className="notfound__icon" aria-hidden="true" />
    <p className="notfound__code font-mono">ERROR 404</p>
    <h1 className="notfound__title">Esta ruta no existe</h1>
    <p className="notfound__text">
      La página que buscas no está disponible o fue movida. Vuelve al inicio para
      seguir explorando los sitios turísticos de Itagüí.
    </p>
    <div className="notfound__actions">
      <Link to="/" className="btn-primary">Volver al inicio</Link>
      <Link to="/calendario" className="btn-secondary">Ver el calendario</Link>
    </div>
  </div>
);

export default NotFound;
