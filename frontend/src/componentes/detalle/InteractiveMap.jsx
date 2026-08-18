// src/componentes/detalle/InteractiveMap.jsx
import { RiNavigationLine, RiMapPin2Line } from 'react-icons/ri';
import { buildGoogleMapsEmbedUrl } from '../../utilidades/googleMaps';
import './InteractiveMap.css';

export const InteractiveMap = ({ site, onStartRoute }) => {
  const embedUrl = buildGoogleMapsEmbedUrl(site);
  const placeName = typeof site?.name === 'string' ? site.name.trim() : '';
  const placeAddress = typeof site?.address === 'string' ? site.address.trim() : '';

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

  const title = placeName ? `Mapa de ${placeName}` : 'Ubicación geográfica';

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

      {(placeName || placeAddress) && (
        <div className="map-place-label" aria-hidden="false">
          <RiMapPin2Line className="map-place-label__icon" aria-hidden="true" />
          <div className="map-place-label__text">
            {placeName && <strong className="map-place-label__name">{placeName}</strong>}
            {placeAddress && <span className="map-place-label__address">{placeAddress}</span>}
          </div>
        </div>
      )}

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
