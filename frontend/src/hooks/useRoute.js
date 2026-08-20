// src/hooks/useRoute.js
import { useState, useCallback } from 'react';

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

/** Coordenadas utilizables (números finitos), venga el dato como sea. */
export const toLatLng = (obj) => {
  if (!obj) return null;
  const lat = Number(obj.lat);
  const lng = Number(obj.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
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
 * Seguimiento de ruta REAL (sin simulación).
 *
 * El avance, la distancia y el tiempo restante son valores DERIVADOS de
 * `livePosition` (la ubicación GPS compartida por AppProvider, un único
 * watchPosition en toda la app). No se guardan en estado: así no hay renders en
 * cascada ni riesgo de que la barra de progreso quede desfasada respecto al GPS.
 *
 * Al iniciar se consulta Google Directions para conocer la distancia y duración
 * reales por carretera; con esa relación se corrige la estimación en línea recta
 * de cada lectura (`roadFactor` y el ritmo min/km reportado por Google), en
 * lugar de suponer siempre 5 km/h a pie y 30 km/h en auto.
 *
 * @param {{lat:number,lng:number}} destination - coordenadas del sitio.
 * @param {'walk'|'car'} mode
 * @param {{lat:number,lng:number}|null} livePosition - ubicación GPS en vivo.
 * @param {string|null} positionError - error de geolocalización, si hay.
 */
export const useRoute = (destination, mode = 'walk', livePosition = null, positionError = null) => {
  const [isActive, setIsActive] = useState(false);
  const [startError, setStartError] = useState(null);
  // { origin, straightKm, roadKm, minPerKm } medidos al iniciar la ruta.
  const [baseline, setBaseline] = useState(null);

  const fallbackSpeedKmh = mode === 'walk' ? 5 : 30;

  const target = toLatLng(destination);
  const live = toLatLng(livePosition);

  const startRoute = useCallback((userCoords) => {
    const origin = toLatLng(userCoords);
    const dest = toLatLng(destination);

    if (!origin) {
      setStartError('No se pudo determinar tu ubicación. Activa el GPS y concede el permiso de ubicación.');
      return;
    }
    // Antes, un sitio sin coordenadas producía distancias absurdas (null → 0)
    // y hacía fallar la llamada a Google Directions.
    if (!dest) {
      setStartError('Este sitio aún no tiene una ubicación exacta registrada. Avísale al administrador.');
      return;
    }

    const straightKm = getHaversineDistance(origin, dest);

    setStartError(null);
    setBaseline({ origin, straightKm, roadKm: straightKm, minPerKm: 60 / fallbackSpeedKmh });
    setIsActive(true);

    // Estimación precisa por carretera. Llega en un callback asíncrono, así que
    // actualizar estado aquí es correcto (no es un render en cascada).
    fetchGoogleRoute(origin, dest, mode)
      .then(({ distanceKm, durationMin }) => {
        setBaseline({
          origin,
          straightKm,
          roadKm: distanceKm,
          minPerKm: distanceKm > 0 ? durationMin / distanceKm : 60 / fallbackSpeedKmh,
        });
      })
      .catch(() => { /* se conserva la estimación en línea recta */ });
  }, [destination, mode, fallbackSpeedKmh]);

  const stopRoute = useCallback(() => {
    setIsActive(false);
    setStartError(null);
    setBaseline(null);
  }, []);

  // ─── Métricas derivadas ───────────────────────────────────
  let distanceRemaining = 0;
  let timeRemaining = 0;
  let progress = 0;
  let arrived = false;

  if (isActive && target && baseline) {
    // Mientras no llega la primera lectura del GPS se usa el punto de partida.
    const from = live || baseline.origin;
    if (from) {
      const straightRemaining = getHaversineDistance(from, target);

      // Proporción entre el recorrido real por calles y la línea recta inicial.
      const roadFactor = baseline.straightKm > 0 ? baseline.roadKm / baseline.straightKm : 1;
      distanceRemaining = straightRemaining * roadFactor;
      timeRemaining = Math.max(1, Math.round(distanceRemaining * baseline.minPerKm));

      progress =
        baseline.straightKm > 0
          ? Math.round(Math.max(0, Math.min(100, (1 - straightRemaining / baseline.straightKm) * 100)))
          : 0;

      // Llegada: dentro de ~30 m del destino (en línea recta).
      if (straightRemaining <= 0.03) {
        progress = 100;
        arrived = true;
      }
    }
  }

  return {
    progress,
    distanceRemaining,
    timeRemaining,
    isActive,
    currentPosition: live,
    // Un error de GPS en curso tiene prioridad sobre el de arranque.
    error: (isActive && positionError) || startError || null,
    arrived,
    startRoute,
    stopRoute,
  };
};
