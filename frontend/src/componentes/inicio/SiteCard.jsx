// src/componentes/inicio/SiteCard.jsx
import { Link } from 'react-router-dom';
import { RiTimeLine, RiArrowRightLine } from 'react-icons/ri';
import { resolveImage } from '../../utilidades/image';
import './SiteCard.css';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=800&q=80';

// Normaliza `tags` / `classifications`, que pueden llegar como array o como
// cadena separada por comas.
const toList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    return value.split(',').map((t) => t.trim()).filter(Boolean);
  }
  return [];
};

export const SiteCard = ({ site }) => {
  const tagsList = toList(site.tags).length ? toList(site.tags) : toList(site.classifications);

  const imageSrc = site.images?.[0] ? resolveImage(site.images[0]) : FALLBACK_IMAGE;

  const handleImageError = (e) => {
    if (e.currentTarget.dataset.fallbackApplied === '1') return;
    e.currentTarget.dataset.fallbackApplied = '1';
    e.currentTarget.src = FALLBACK_IMAGE;
  };

  // Un <Link> en lugar de un <div onClick>: navegable con teclado, anunciado
  // por lectores de pantalla, indexable y compatible con "abrir en nueva pestaña".
  return (
    <article className="site-card">
      <Link to={`/site/${site.id}`} className="site-card__link">
        <div className="site-card__image-wrap">
          <img
            src={imageSrc}
            alt={site.name}
            loading="lazy"
            decoding="async"
            width="800"
            height="500"
            onError={handleImageError}
          />
          <div className="site-card__image-badge">
            <span>{site.category}</span>
          </div>
        </div>

        <div className="site-card__body">
          <h3 className="site-card__name">{site.name}</h3>
          <p className="site-card__desc">{site.description}</p>

          {tagsList.length > 0 && (
            <div className="site-card__tags">
              {tagsList.map((tag, idx) => (
                <span key={idx} className="site-card__tag-badge">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="site-card__footer">
            <div className="site-card__meta">
              <RiTimeLine className="site-card__meta-icon" aria-hidden="true" />
              <span className="site-card__meta-text">{site.hours || 'Horario por confirmar'}</span>
            </div>
            <div className="site-card__action">
              <span className="site-card__action-text">Explorar</span>
              <RiArrowRightLine className="site-card__action-icon" aria-hidden="true" />
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};
