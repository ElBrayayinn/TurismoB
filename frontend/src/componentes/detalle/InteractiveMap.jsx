// src/componentes/detalle/InteractiveMap.jsx
import { RiNavigationLine } from 'react-icons/ri';
import { buildGoogleMapsEmbedUrl } from '../../utilidades/googleMaps';
import './InteractiveMap.css';

export const InteractiveMap = ({ site, onStartRoute }) => {
  const embedUrl = buildGoogleMapsEmbedUrl(site);

  if (!embedUrl) {
    return (
      <div className="map-container map-container--loading">
        <p className="map-container__loading-text">
          Este sitio aún no tiene una ubicación registrada para mostrar en el mapa.
        </p>
        {onStartRoute && (
          <div className="map-actions">
            <button className="map-actions__btn" type="button" onClick={onStartRoute}>
              <RiNavigationLine />
              <span>Fijar Ruta de Destino</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  const title = site?.name ? `Mapa de ${site.name}` : 'Ubicación geográfica';

  return (
    <div className="map-container">
      <iframe
        className="map-container__iframe"
        title={title}
        src={embedUrl}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />

      {onStartRoute && (
        <div className="map-actions">
          <button className="map-actions__btn" type="button" onClick={onStartRoute}>
            <RiNavigationLine />
            <span>Fijar Ruta de Destino</span>
          </button>
        </div>
      )}
    </div>
  );
};
