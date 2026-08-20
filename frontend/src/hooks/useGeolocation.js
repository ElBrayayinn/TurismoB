// src/hooks/useGeolocation.js
import { useState, useEffect } from 'react';

// Coordenadas del Parque Principal de Itagüí como último recurso (solo si el
// usuario deniega el permiso o el GPS no está disponible).
const FALLBACK = { lat: 6.1724, lng: -75.6091 };

const geolocationSupported =
  typeof navigator !== 'undefined' && 'geolocation' in navigator;

const NOT_SUPPORTED = {
  position: FALLBACK,
  error: 'Geolocalización no soportada en este navegador.',
  loading: false,
  isSimulated: true,
};

const IDLE = { position: null, error: null, loading: false, isSimulated: false };

/**
 * Ubicación REAL del usuario, en vivo (watchPosition).
 *
 * IMPORTANTE: se instancia UNA sola vez en AppProvider y se comparte por
 * contexto. Antes se llamaba en App y en SiteDetailPage a la vez, y `useRoute`
 * abría un tercer `watchPosition`: tres suscripciones GPS de alta precisión en
 * paralelo, con el consiguiente consumo de batería en móvil.
 *
 * `enabled` mantiene el GPS apagado hasta que alguna vista lo necesita, para no
 * lanzar el diálogo de permisos en la portada.
 *
 * `isSimulated` es true solo cuando se cae al centro de Itagüí porque no hay
 * permiso o señal (para poder avisarlo en la UI).
 *
 * Nota: la geolocalización del navegador exige contexto seguro (HTTPS) o
 * localhost. En el servidor de la Alcaldía debe servirse por HTTPS.
 */
export const useGeolocation = (enabled = true) => {
  // Un único objeto de estado: se actualiza solo desde los callbacks del
  // navegador (sistema externo), nunca de forma síncrona en el efecto.
  const [reading, setReading] = useState(null);

  useEffect(() => {
    if (!enabled || !geolocationSupported) return;

    const handleSuccess = (pos) => {
      setReading({
        position: {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        },
        error: null,
        isSimulated: false,
      });
    };

    const handleError = (err) => {
      console.warn(`Error de geolocalización (${err.code}): ${err.message}.`);
      setReading({
        // Último recurso: Itagüí Centro, marcado como simulado.
        position: FALLBACK,
        error:
          err.code === 1
            ? 'Permiso de ubicación denegado. Actívalo para seguir la ruta en tiempo real.'
            : 'No se pudo obtener tu ubicación GPS. Revisa la señal e inténtalo de nuevo.',
        isSimulated: true,
      });
    };

    // Seguimiento en vivo de la ubicación real del dispositivo.
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 2000,
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  if (!enabled) return IDLE;
  if (!geolocationSupported) return NOT_SUPPORTED;

  // `loading` es derivado: se está buscando señal mientras no hay lectura.
  if (!reading) return { ...IDLE, loading: true };

  return { ...reading, loading: false };
};
