// src/componentes/detalle/RouteModal.jsx
import { useState, useEffect, useMemo, useContext } from 'react';
import { 
  RiCloseLine, 
  RiCarLine, 
  RiWalkLine, 
  RiNavigationLine,
  RiSubtractLine,
  RiFlagLine,
  RiUserLocationLine,
  RiErrorWarningLine,
  RiCheckboxCircleLine
} from 'react-icons/ri';
import { useRoute } from '../../hooks/useRoute';
import { AppContext } from '../../contexto/AppContext';
import './RouteModal.css';



export const RouteModal = ({ isOpen, onClose, site, userPosition, userLocationSimulated = false }) => {
  const { isRouteMapOpen, setIsRouteMapOpen, setActiveRouteMode } = useContext(AppContext);
  const [step, setStep] = useState('transport'); // 'transport' | 'confirm' | 'tracking'
  const [mode, setMode] = useState('walk'); // 'walk' | 'car'
  const [isMinimized, setIsMinimized] = useState(false);

  // Estados de acoplamiento de la Isla Dinámica (Desktop Drag & Snap)
  const [dockPosition, setDockPosition] = useState('top'); // 'top' | 'bottom' | 'left' | 'right'
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const {
    progress,
    distanceRemaining,
    timeRemaining,
    error: gpsError,
    arrived,
    startRoute,
    stopRoute
  } = useRoute(site, mode);

  // Guardar hora de inicio fija
  const startTime = useMemo(() => {
    if (step === 'tracking') {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return '';
  }, [step]);

  // Calcular hora estimada de llegada
  const endTime = useMemo(() => {
    if (step === 'tracking') {
      const now = new Date();
      now.setMinutes(now.getMinutes() + timeRemaining);
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return '';
  }, [step, timeRemaining]);

  const timelineTitle = useMemo(() => {
    if (!site) return "Ruta de Destino";
    return `Ruta a ${site.name}`;
  }, [site]);

  const [isClosing, setIsClosing] = useState(false);

  // Limpiar estados al desmontar
  useEffect(() => {
    return () => {
      stopRoute();
      setIsRouteMapOpen(false);
    };
  }, [stopRoute, setIsRouteMapOpen]);

  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode);
    setStep('confirm');
  };

  const handleStart = () => {
    setStep('tracking');
    setIsMinimized(false);
    setActiveRouteMode(mode);
    startRoute(userPosition);
  };

  const handleCancel = () => {
    setStep('transport');
    stopRoute();
    setIsRouteMapOpen(false);
  };

  const handleClose = () => {
    setIsClosing(true);
  };

  const handleTransitionEnd = (e) => {
    // Esperamos a que la transición de opacidad termine para cerrar realmente
    if (isClosing && e.propertyName === 'opacity') {
      stopRoute();
      setIsRouteMapOpen(false);
      onClose();
      setIsClosing(false);
    }
  };

  // Manejo de Arrastre para Desktop
  const handleMouseDown = (e) => {
    if (window.innerWidth <= 768) return; // Solo drag en desktop
    if (isRouteMapOpen) return; // Desactivar drag si el mapa está abierto (forzado a la izquierda)
    
    // Si hace clic en un botón, enlace, imagen o íconos, no arrastrar
    if (e.target.closest('button, a, img, svg, path')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    setDragPos({
      x: rect.left,
      y: rect.top
    });
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      setDragPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = (e) => {
      setIsDragging(false);
      
      const el = document.querySelector('.route-modal') || document.querySelector('.route-pill');
      let centerX = e.clientX;
      let centerY = e.clientY;
      
      if (el) {
        const rect = el.getBoundingClientRect();
        centerX = rect.left + rect.width / 2;
        centerY = rect.top + rect.height / 2;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;

      // Calcular distancia a los 4 bordes desde el centro del elemento
      const distTop = centerY;
      const distBottom = h - centerY;
      const distLeft = centerX;
      const distRight = w - centerX;

      const minDist = Math.min(distTop, distBottom, distLeft, distRight);

      // Snap al borde más cercano
      if (minDist === distTop) {
        setDockPosition('top');
      } else if (minDist === distBottom) {
        setDockPosition('bottom');
      } else if (minDist === distLeft) {
        setDockPosition('left');
      } else {
        setDockPosition('right');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  // Distancia inicial estimatoria para el paso de confirmación
  const initialDistance = userPosition 
    ? (Math.sqrt(Math.pow(site.lat - userPosition.lat, 2) + Math.pow(site.lng - userPosition.lng, 2)) * 111.12) // aprox km
    : 1.5;

  const initialTime = Math.round((initialDistance / (mode === 'walk' ? 5 : 30)) * 60);

  const isMobile = window.innerWidth <= 768;
  const currentDock = isMobile ? 'bottom' : (isRouteMapOpen ? 'left' : dockPosition);
  const isPill = isMinimized && step === 'tracking';

  const modalStyles = isDragging ? {
    position: 'fixed',
    left: dragPos.x,
    top: dragPos.y,
    margin: 0,
    transform: 'none',
    cursor: 'grabbing'
  } : {};

  return (
    <div className={`modal-overlay ${isPill ? 'modal-overlay--minimized' : ''}`} onClick={!isPill ? handleClose : undefined}>
      <div 
        className={`route-modal ${isPill ? 'route-modal--minimized' : ''} ${step === 'tracking' && !isPill ? 'route-modal--tracking' : ''} ${isDragging ? 'route-modal--dragging' : ''} ${isClosing ? 'route-modal--closing' : ''} route-modal--dock-${currentDock}`} 
        onClick={(e) => {
          e.stopPropagation();
          if (isPill) setIsMinimized(false);
        }}
        onMouseDown={handleMouseDown}
        onTransitionEnd={handleTransitionEnd}
        style={modalStyles}
        title={isPill ? "Arrastra a los bordes para mover. Haz clic para maximizar." : (window.innerWidth > 768 ? "Arrastra desde una zona vacía para acoplar a un borde" : undefined)}
      >
        <div className={`route-pill-content ${!isPill ? 'route-pill-content--hidden' : ''}`}>
          {mode === 'walk' ? <RiWalkLine className="route-pill__icon" /> : <RiCarLine className="route-pill__icon" />}
          <span className="route-pill__text">{distanceRemaining.toFixed(2)} km</span>
        </div>

        <div className={`route-modal-content ${isPill ? 'route-modal-content--hidden' : ''}`}>
          {window.innerWidth > 768 && <div className="route-modal__drag-handle" />}
          <div className="route-modal__actions-top">
            {step === 'tracking' && (
              <button 
                className="route-modal__minimize" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(true);
                }} 
                aria-label="Minimizar ruta"
                title="Minimizar"
              >
                <RiSubtractLine />
              </button>
            )}
            <button className="route-modal__close" onClick={handleClose} aria-label="Cerrar modal">
              <RiCloseLine />
            </button>
          </div>

          {/* PASO 1: Selección de transporte */}
        {step === 'transport' && (
          <div className="route-modal-step">
            <h3 className="route-modal__title">¿Cómo quieres llegar?</h3>
            <div className="transport-options">
              <button className="transport-btn" onClick={() => handleSelectMode('car')}>
                <RiCarLine />
                <span>En auto</span>
              </button>
              <button className="transport-btn" onClick={() => handleSelectMode('walk')}>
                <RiWalkLine />
                <span>A pie</span>
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Confirmación de ruta */}
        {step === 'confirm' && (
          <div className="route-modal-step">
            <p className="confirm-title-label">Ruta de destino</p>
            <h3 className="confirm-destination">{site.name}</h3>
            
            <div className="confirm-divider" />
            
            <div className="confirm-details">
              {mode === 'walk' ? <RiWalkLine size={20} /> : <RiCarLine size={20} />}
              <span>
                <strong>{mode === 'walk' ? 'Caminando' : 'En auto'}</strong>
                {' · '}
                ~{initialTime} min
                {' · '}
                {initialDistance.toFixed(1)} km
              </span>
            </div>

            {/* Estado de la ubicación real del usuario */}
            {!userPosition ? (
              <p className="route-gps-status route-gps-status--wait">
                <RiUserLocationLine /> Obteniendo tu ubicación GPS…
              </p>
            ) : userLocationSimulated ? (
              <p className="route-gps-status route-gps-status--warn">
                <RiErrorWarningLine /> No se pudo acceder a tu GPS; se usará el centro de Itagüí. Activa la ubicación para una ruta real.
              </p>
            ) : (
              <p className="route-gps-status route-gps-status--ok">
                <RiUserLocationLine /> Ubicación real detectada. La ruta seguirá tu movimiento en tiempo real.
              </p>
            )}

            <div className="confirm-actions">
              <button className="confirm-btn-cancel" onClick={handleCancel}>
                Atrás
              </button>
              <button className="confirm-btn-start" onClick={handleStart} disabled={!userPosition}>
                <RiNavigationLine />
                <span>Iniciar Ruta</span>
              </button>
            </div>
          </div>
        )}

              {/* PASO 3: Seguimiento Activo - Estilo Timeline */}
        {step === 'tracking' && (
          <div className="route-modal-step">
            <h3 className="route-modal__title route-tracking-title">{timelineTitle}</h3>

            {/* Progreso de Ruta */}
            <div className="timeline-progress-section">
              <div className="timeline-progress-labels">
                <span className="progress-label-title">PROGRESO DE RUTA (INICIO: {startTime})</span>
                <span className="progress-label-value font-mono">{progress}% Completado</span>
              </div>
              <div className="timeline-progress-bar-track">
                <div className="timeline-progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>

              {/* Estado del seguimiento por GPS real */}
              {arrived ? (
                <p className="route-gps-status route-gps-status--ok">
                  <RiCheckboxCircleLine /> ¡Has llegado a tu destino!
                </p>
              ) : gpsError ? (
                <p className="route-gps-status route-gps-status--warn">
                  <RiErrorWarningLine /> {gpsError}
                </p>
              ) : (
                <p className="route-gps-status route-gps-status--ok">
                  <RiUserLocationLine /> Siguiendo tu ubicación en tiempo real…
                </p>
              )}
            </div>

            {/* Timeline */}
            <div className="route-timeline">
              {/* Origen: Mi ubicación */}
              <div className="timeline-item timeline-item--start">
                <div className="timeline-left">
                  <div className="timeline-check timeline-check--start">
                    <RiUserLocationLine size={14} />
                  </div>
                  <div className="timeline-line"></div>
                </div>
                <div className="timeline-right">
                  <span className="timeline-stop-name">Mi ubicación</span>
                  <span className="timeline-stop-time font-mono">SALIDA {startTime}</span>
                </div>
              </div>

              {/* Destino: Sitio seleccionado */}
              <div className="timeline-item timeline-item--current">
                <div className="timeline-left">
                  <div className="timeline-check timeline-check--current">
                    <div className="timeline-check__dot"></div>
                  </div>
                </div>
                <div className="timeline-right">
                  <div className="next-stop-card">
                    <div className="next-stop-card__badge">
                      <RiNavigationLine size={12} />
                      <span>DESTINO FINAL</span>
                    </div>
                    <h4 className="next-stop-card__title">{site.name}</h4>
                    <p className="next-stop-card__desc">{site.description}</p>
                  </div>
                  <div className="route-metadata-outside">
                    <span className="next-stop-meta-badge font-mono">
                      COORDS: {site.lat ? parseFloat(site.lat).toFixed(4) : '6.1718'}° N
                    </span>
                    <span className="next-stop-time-remaining">
                      {mode === 'walk' ? <RiWalkLine /> : <RiCarLine />}
                      <span>Llegada aprox. {endTime} (~{timeRemaining} min)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="timeline-actions-bottom">
              <button className="timeline-close-map-btn" onClick={() => setIsRouteMapOpen(!isRouteMapOpen)}>
                {isRouteMapOpen ? 'Cerrar Mapa' : 'Abrir Mapa'}
              </button>
              <button className="timeline-finish-route-btn" onClick={() => { stopRoute(); setIsRouteMapOpen(false); onClose(); }}>
                <span>Finalizar Ruta</span>
                <RiFlagLine />
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
