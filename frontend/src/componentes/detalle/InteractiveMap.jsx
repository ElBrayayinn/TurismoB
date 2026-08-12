// src/componentes/detalle/InteractiveMap.jsx
import { useEffect, useState } from 'react';
import { Map, AdvancedMarker, InfoWindow, ColorScheme } from '@vis.gl/react-google-maps';
import { RiNavigationLine } from 'react-icons/ri';
import { useIsDarkTheme } from '../../hooks/useDarkMode';
import { useIsMobile } from '../../hooks/useMediaQuery';
import './InteractiveMap.css';

const ITAGUI_CENTER = { lat: 6.1724, lng: -75.6091 };
// Map ID de prueba provisto por Google (funciona sin configurar nada en Cloud Console).
// Para producción, crea un Map ID propio en "Google Maps Platform > Map Management".
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

export const InteractiveMap = ({ site, userPosition, onStartRoute }) => {
  const [coordinates, setCoordinates] = useState(() => {
    if (site.lat && site.lng) return { lat: parseFloat(site.lat), lng: parseFloat(site.lng) };
    return null;
  });
  const [loading, setLoading] = useState(() => !(site.lat && site.lng));
  const [siteInfoOpen, setSiteInfoOpen] = useState(false);
  const isDark = useIsDarkTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (site.lat && site.lng) {
      Promise.resolve().then(() => {
        setCoordinates({ lat: parseFloat(site.lat), lng: parseFloat(site.lng) });
        setLoading(false);
      });
      return;
    }

    if (!site.address) {
      Promise.resolve().then(() => {
        setCoordinates(ITAGUI_CENTER);
        setLoading(false);
      });
      return;
    }

    Promise.resolve().then(() => setLoading(true));
    const query = site.address.toLowerCase().includes('itagüí') || site.address.toLowerCase().includes('itagui')
      ? site.address
      : `${site.address}, Itagüí, Colombia`;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setCoordinates({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } else {
          setCoordinates(ITAGUI_CENTER);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Dynamic geocoding error:', err);
        setCoordinates(ITAGUI_CENTER);
        setLoading(false);
      });
  }, [site.address, site.lat, site.lng]);

  if (loading || !coordinates) {
    return (
      <div className="map-container map-container--loading">
        <p className="map-container__loading-text">Cargando ubicación en el mapa…</p>
      </div>
    );
  }

  const mapCenter = userPosition ? { lat: userPosition.lat, lng: userPosition.lng } : coordinates;

  return (
    <div className="map-container">
      <Map
        mapId={MAP_ID}
        defaultCenter={mapCenter}
        defaultZoom={15}
        colorScheme={isDark ? ColorScheme.DARK : ColorScheme.LIGHT}
        gestureHandling="greedy"
        disableDefaultUI={false}
        streetViewControl={false}
        mapTypeControl={false}
        /* En móvil se ocultan los controles que estorban en pantallas pequeñas
           y se acerca el zoom por defecto, que se ve mejor en poco espacio. */
        fullscreenControl={!isMobile}
        zoomControl={!isMobile}
        clickableIcons={!isMobile}
      >
        {/* Marcador del sitio turístico */}
        <AdvancedMarker position={coordinates} onClick={() => setSiteInfoOpen(true)}>
          <div className="site-map-icon">
            <div className="site-marker-pin" />
          </div>
        </AdvancedMarker>

        {siteInfoOpen && (
          <InfoWindow position={coordinates} onCloseClick={() => setSiteInfoOpen(false)}>
            <div>
              <h4>{site.name}</h4>
              <p>{site.address}</p>
            </div>
          </InfoWindow>
        )}

        {/* Marcador del usuario (si está disponible) */}
        {userPosition && (
          <AdvancedMarker position={{ lat: userPosition.lat, lng: userPosition.lng }}>
            <div className="gps-pulse-icon">
              <div className="gps-pulse-ring" />
              <div className="gps-pulse-dot" />
            </div>
          </AdvancedMarker>
        )}
      </Map>

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
