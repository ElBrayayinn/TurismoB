// src/componentes/inicio/EventSlider.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { RiArrowLeftSLine, RiArrowRightSLine } from 'react-icons/ri';
import { resolveImage } from '../../utilidades/image';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import './EventSlider.css';

const AUTOPLAY_MS = 5500;
const SWIPE_THRESHOLD = 45; // px mínimos de deslizamiento horizontal

export const EventSlider = ({ announcements }) => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  const length = Array.isArray(announcements) ? announcements.length : 0;

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === length - 1 ? 0 : prev + 1));
  }, [length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev === 0 ? length - 1 : prev - 1));
  }, [length]);

  // Índice saneado: si un anuncio se elimina, el índice guardado podría
  // apuntar fuera de la lista. Se acota al leerlo en lugar de corregirlo con un
  // efecto (que provocaría un render extra).
  const activeIndex = length > 0 ? Math.min(current, length - 1) : 0;

  // Autoplay: se detiene con hover, con el dedo sobre el carrusel, cuando la
  // pestaña no está visible y si el usuario pidió menos animaciones.
  useEffect(() => {
    if (isPaused || length <= 1 || reducedMotion) return;

    timeoutRef.current = setTimeout(nextSlide, AUTOPLAY_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [activeIndex, isPaused, length, nextSlide, reducedMotion]);

  useEffect(() => {
    const onVisibility = () => setIsPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // ─── Gesto de deslizamiento ───────────────────────────────
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const isHorizontalSwipe = useRef(false);

  const handleTouchStart = (e) => {
    const t = e.targetTouches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    isHorizontalSwipe.current = false;
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const t = e.targetTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;

    // Solo se considera swipe si el gesto es más horizontal que vertical; así
    // no se secuestra el scroll de la página al desplazarse hacia abajo.
    if (!isHorizontalSwipe.current && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      isHorizontalSwipe.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;

    if (isHorizontalSwipe.current && Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = false;
    setIsPaused(false);
  };

  // Flechas del teclado para navegar el carrusel.
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
  };

  if (length <= 0) return null;

  return (
    <section
      className="slider"
      aria-roledescription="carrusel"
      aria-label="Anuncios destacados"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Contenedor de slides */}
      <div
        className="slider__track"
        style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
      >
        {announcements.map((slide, idx) => (
          <div
            className="slider__slide"
            key={slide.id}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${idx + 1} de ${length}`}
            aria-hidden={idx !== activeIndex}
          >
            <img
              src={resolveImage(slide.image)}
              alt={slide.title}
              className="slider__img"
              /* El primer anuncio es la imagen principal de la portada: se
                 carga con prioridad; el resto, en diferido. */
              loading={idx === 0 ? 'eager' : 'lazy'}
              fetchPriority={idx === 0 ? 'high' : 'low'}
              decoding="async"
            />
            <div className="slider__overlay">
              <span className="slider__badge">ANUNCIO DESTACADO</span>
              <h2 className="slider__title">{slide.title}</h2>
              <p className="slider__desc">
                {[slide.date, slide.cta].filter(Boolean).join(' • ')}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Controles de Navegación del Carrusel */}
      {length > 1 && (
        <>
          <div className="slider__controls">
            <button
              type="button"
              className="slider__control-btn"
              onClick={prevSlide}
              aria-label="Anuncio anterior"
            >
              <RiArrowLeftSLine size={22} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="slider__control-btn"
              onClick={nextSlide}
              aria-label="Siguiente anuncio"
            >
              <RiArrowRightSLine size={22} aria-hidden="true" />
            </button>
          </div>

          {/* Puntos indicadores */}
          <div className="slider__dots">
            {announcements.map((slide, idx) => (
              <button
                type="button"
                key={slide.id}
                className={`slider__dot ${activeIndex === idx ? 'slider__dot--active' : ''}`}
                onClick={() => setCurrent(idx)}
                aria-label={`Ir al anuncio ${idx + 1}`}
                aria-current={activeIndex === idx}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
