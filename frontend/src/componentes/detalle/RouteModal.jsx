// src/componentes/detalle/RouteModal.jsx
import { useState } from 'react';
import {
  RiCloseLine,
  RiCarLine,
  RiWalkLine,
  RiErrorWarningLine,
} from 'react-icons/ri';
import { buildGoogleMapsDirectionsUrl } from '../../utilidades/googleMaps';
import { useIsMobile } from '../../hooks/useMediaQuery';
import './RouteModal.css';

export const RouteModal = ({
  isOpen,
  onClose,
  site,
  userPosition,
  userLocationSimulated = false,
}) => {
  const isMobile = useIsMobile();
  const [isClosing, setIsClosing] = useState(false);
  const [noDestination, setNoDestination] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => setIsClosing(true);

  const handleTransitionEnd = (e) => {
    if (isClosing && e.propertyName === 'opacity') {
      onClose();
      setIsClosing(false);
      setNoDestination(false);
    }
  };

  const handleSelectMode = (mode) => {
    const origin =
      !userLocationSimulated && userPosition
        ? { lat: userPosition.lat, lng: userPosition.lng }
        : null;

    const url = buildGoogleMapsDirectionsUrl(site, mode, origin, {
      compact: isMobile,
    });
    if (!url) {
      setNoDestination(true);
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className={`route-modal route-modal--dock-top ${isClosing ? 'route-modal--closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={handleTransitionEnd}
        role="dialog"
        aria-modal="true"
        aria-label={site?.name ? `Cómo llegar a ${site.name}` : 'Cómo llegar'}
      >
        <div className="route-modal-content">
          <div className="route-modal__actions-top">
            <button
              className="route-modal__close"
              onClick={handleClose}
              aria-label="Cerrar modal"
            >
              <RiCloseLine />
            </button>
          </div>

          <div className="route-modal-step">
            <h3 className="route-modal__title">¿Cómo quieres llegar?</h3>

            {noDestination && (
              <p className="route-gps-status route-gps-status--warn">
                <RiErrorWarningLine /> Este sitio aún no tiene una ubicación
                registrada, por lo que no es posible abrir la ruta en Google Maps.
              </p>
            )}

            <div className="transport-options">
              <button
                className="transport-btn"
                type="button"
                onClick={() => handleSelectMode('car')}
              >
                <RiCarLine />
                <span>En auto</span>
              </button>
              <button
                className="transport-btn"
                type="button"
                onClick={() => handleSelectMode('walk')}
              >
                <RiWalkLine />
                <span>A pie</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
