// src/componentes/admin/LocationPicker.jsx
// Selector de ubicación real para el formulario de sitios: un mapa con un
// marcador que el administrador puede arrastrar (o colocar con un clic) para
// fijar la ubicación EXACTA. El botón "Buscar dirección" geocodifica el texto
// vía el backend y centra el marcador; luego se ajusta a mano si hace falta.
import { useState, useEffect } from 'react';
import { Map, AdvancedMarker, useMap, ColorScheme } from '@vis.gl/react-google-maps';
import { RiMapPin2Line, RiSearchLine } from 'react-icons/ri';
import { geocodeApi } from '../../utilidades/api';
import { useIsDarkTheme } from '../../hooks/useDarkMode';
import './LocationPicker.css';

const ITAGUI_CENTER = { lat: 6.1724, lng: -75.6091 };
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

// Centra el mapa cuando cambian las coordenadas seleccionadas y habilita
// colocar el marcador con un clic en cualquier punto del mapa.
function MapController({ center, onMove }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;
    const zoom = map.getZoom() < 15 ? 16 : map.getZoom();
    map.setCenter(center);
    map.setZoom(zoom);
  }, [center, map]);

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('click', (e) => {
      onMove(e.latLng.lat(), e.latLng.lng());
    });
    return () => listener.remove();
  }, [map, onMove]);

  return null;
}

export function LocationPicker({ address, lat, lng, onChange, showAlert }) {
  const [searching, setSearching] = useState(false);
  const isDark = useIsDarkTheme();

  const hasCoords =
    lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  const position = hasCoords ? { lat: Number(lat), lng: Number(lng) } : null;
  const center = position || ITAGUI_CENTER;

  const handleSearch = async () => {
    if (!address || !address.trim()) {
      showAlert?.('Dirección vacía', 'Escribe primero la dirección para buscarla en el mapa.', 'warning');
      return;
    }
    setSearching(true);
    try {
      const r = await geocodeApi.search(address);
      if (r.found && r.lat != null && r.lng != null) {
        onChange(r.lat, r.lng);
      } else {
        showAlert?.(
          'Ubicación no encontrada',
          'No se encontró la dirección exacta. Haz clic en el mapa o arrastra el marcador al punto correcto.',
          'warning'
        );
      }
    } catch (err) {
      showAlert?.('Error', err.message || 'No se pudo buscar la dirección.', 'danger');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="location-picker">
      <div className="location-picker__toolbar">
        <button type="button" className="btn-secondary location-picker__search-btn" onClick={handleSearch} disabled={searching}>
          <RiSearchLine size={16} />
          <span>{searching ? 'Buscando…' : 'Buscar dirección en el mapa'}</span>
        </button>
        <span className="location-picker__coords font-mono">
          {hasCoords ? `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}` : 'Sin ubicación fijada'}
        </span>
      </div>

      <div className="location-picker__map">
        <Map
          mapId={MAP_ID}
          defaultCenter={center}
          defaultZoom={hasCoords ? 16 : 14}
          colorScheme={isDark ? ColorScheme.DARK : ColorScheme.LIGHT}
          gestureHandling="greedy"
          disableDefaultUI={false}
          streetViewControl={false}
          mapTypeControl={false}
        >
          <MapController center={position} onMove={onChange} />
          {position && (
            <AdvancedMarker
              position={position}
              draggable
              onDragEnd={(e) => onChange(e.latLng.lat(), e.latLng.lng())}
            >
              <div className="picker-map-icon">
                <div className="site-marker-pin" />
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </div>

      <p className="location-picker__hint">
        <RiMapPin2Line size={14} />
        <span>Haz clic o arrastra el marcador para fijar la ubicación exacta del sitio.</span>
      </p>
    </div>
  );
}
