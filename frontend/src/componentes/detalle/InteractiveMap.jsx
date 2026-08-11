// src/componentes/detalle/InteractiveMap.jsx
import { useEffect, useState } from 'react';
import { Map, AdvancedMarker, InfoWindow, useMap, useMapsLibrary, ColorScheme } from '@vis.gl/react-google-maps';
import { RiNavigationLine } from 'react-icons/ri';
import './InteractiveMap.css';

const ITAGUI_CENTER = { lat: 6.1724, lng: -75.6091 };
// Map ID de prueba provisto por Google (funciona sin configurar nada en Cloud Console).
// Para producción, crea un Map ID propio en "Google Maps Platform > Map Management".
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

// Traza la ruta real (calles y avenidas) entre el usuario y el sitio usando la Directions API.
function DirectionsRoute({ origin, destination, mode }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    // Se difiere para no hacer setState síncrono dentro del efecto.
    Promise.resolve().then(() => {
      setDirectionsService(new routesLibrary.DirectionsService());
      setDirectionsRenderer(
        new routesLibrary.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: { strokeColor: '#E8B400', strokeWeight: 6, strokeOpacity: 0.85 }
        })
      );
    });
  }, [routesLibrary, map]);

  // Limpiar la línea del mapa al desmontar el componente.
  useEffect(() => {
    return () => directionsRenderer?.setMap(null);
  }, [directionsRenderer]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !origin || !destination) return;

    directionsService
      .route({
        origin,
        destination,
        travelMode: mode === 'walk' ? 'WALKING' : 'DRIVING'
      })
      .then((result) => {
        directionsRenderer.setDirections(result);
        const bounds = result.routes[0]?.bounds;
        if (bounds) map.fitBounds(bounds, 50);
      })
      .catch((err) => console.error('Error calculando ruta con Google Directions:', err));
  }, [directionsService, directionsRenderer, origin, destination, mode, map]);

  return null;
}

export const InteractiveMap = ({ site, userPosition, onStartRoute, showRoute = false, routeMode = 'walk' }) => {
  const [coordinates, setCoordinates] = useState(() => {
    if (site.lat && site.lng) return { lat: parseFloat(site.lat), lng: parseFloat(site.lng) };
    return null;
  });
  const [loading, setLoading] = useState(() => !(site.lat && site.lng));
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [siteInfoOpen, setSiteInfoOpen] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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
      <div className="map-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface-alt)', minHeight: '300px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Cargando ubicación en el mapa...</p>
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

        {/* Ruta trazada en tiempo real */}
        {showRoute && userPosition && (
          <DirectionsRoute
            origin={{ lat: userPosition.lat, lng: userPosition.lng }}
            destination={coordinates}
            mode={routeMode}
          />
        )}
      </Map>

      {/* Botón flotante para fijar ruta si se tiene la ubicación del usuario */}
      {userPosition && onStartRoute && (
        <div className="map-actions">
          <button className="map-actions__btn" onClick={onStartRoute}>
            <RiNavigationLine />
            <span>Fijar Ruta de Destino</span>
          </button>
        </div>
      )}
    </div>
  );
};
