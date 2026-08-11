// src/hooks/useRoute.js
import { useState, useEffect, useRef, useCallback } from 'react';

// Fórmula Haversine: distancia en km entre dos coordenadas (línea recta).
const getHaversineDistance = (p1, p2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Distancia y duración REALES por carretera vía Google Directions API (mismo
// servicio que dibuja la línea en el mapa). Devuelve { distanceKm, durationMin }.
async function fetchGoogleRoute(origin, destination, mode) {
  if (!window.google?.maps?.importLibrary) throw new Error('Google Maps no está disponible aún');
  const { DirectionsService } = await window.google.maps.importLibrary('routes');
  const service = new DirectionsService();
  const result = await service.route({
    origin,
    destination,
    travelMode: mode === 'walk' ? 'WALKING' : 'DRIVING',
  });
  const leg = result.routes[0]?.legs[0];
  if (!leg) throw new Error('Sin ruta');
  return {
    distanceKm: leg.distance.value / 1000,
    durationMin: leg.duration.value / 60,
  };
}

/**
 * Seguimiento de ruta REAL (sin simulación). El avance, la distancia y el tiempo
 * restante se calculan a partir de la ubicación GPS real del dispositivo
 * (watchPosition). La estimación inicial usa la distancia real por carretera.
 */
export const useRoute = (destination, mode = 'walk') => {
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [error, setError] = useState(null);
  const [arrived, setArrived] = useState(false);

  const startPositionRef = useRef(null);
  const initialDistanceRef = useRef(0);
  const watchIdRef = useRef(null);

  const speedKmh = mode === 'walk' ? 5 : 30;

  const startRoute = useCallback((userCoords) => {
    if (!userCoords || !destination) {
      setError('No se pudo determinar tu ubicación. Activa el GPS y concede el permiso de ubicación.');
      return;
    }
    setError(null);
    setArrived(false);
    startPositionRef.current = userCoords;
    setCurrentPosition(userCoords);
    setIsActive(true);
    setProgress(0);

    // Estimación inmediata en línea recta mientras llega la de carretera.
    const straight = getHaversineDistance(userCoords, destination);
    initialDistanceRef.current = straight;
    setDistanceRemaining(straight);
    setTimeRemaining(Math.max(1, Math.round((straight / speedKmh) * 60)));

    // Estimación inicial precisa por carretera (real) vía Google Directions.
    fetchGoogleRoute(userCoords, destination, mode)
      .then(({ distanceKm, durationMin }) => {
        initialDistanceRef.current = distanceKm;
        setDistanceRemaining(distanceKm);
        setTimeRemaining(Math.max(1, Math.round(durationMin)));
      })
      .catch(() => { /* se conserva la estimación en línea recta */ });
  }, [destination, mode, speedKmh]);

  const stopRoute = useCallback(() => {
    setIsActive(false);
    setProgress(0);
    setDistanceRemaining(0);
    setTimeRemaining(0);
    setCurrentPosition(null);
    setArrived(false);
    setError(null);
    startPositionRef.current = null;

    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Seguimiento con GPS REAL: el progreso refleja tu movimiento real, no un temporizador.
  useEffect(() => {
    if (!isActive || !destination || !startPositionRef.current) return;

    if (!navigator.geolocation) {
      // Se difiere para no hacer setState síncrono dentro del efecto.
      Promise.resolve().then(() => setError('Este navegador no soporta geolocalización.'));
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const cur = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentPosition(cur);
        setError(null);

        const remaining = getHaversineDistance(cur, destination);
        setDistanceRemaining(remaining);
        setTimeRemaining(Math.max(1, Math.round((remaining / speedKmh) * 60)));

        const total = initialDistanceRef.current || getHaversineDistance(startPositionRef.current, destination);
        const traveled = total - remaining;
        const pct = total > 0 ? Math.max(0, Math.min(100, (traveled / total) * 100)) : 0;
        setProgress(Math.round(pct));

        // Llegada: dentro de ~30 m del destino.
        if (remaining <= 0.03) {
          setProgress(100);
          setArrived(true);
        }
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Permiso de ubicación denegado. Actívalo para seguir la ruta en tiempo real.'
            : 'No se pudo obtener tu ubicación GPS. Revisa la señal e inténtalo de nuevo.'
        );
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 }
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isActive, destination, mode, speedKmh]);

  return {
    progress,
    distanceRemaining,
    timeRemaining,
    isActive,
    currentPosition,
    error,
    arrived,
    startRoute,
    stopRoute,
  };
};
