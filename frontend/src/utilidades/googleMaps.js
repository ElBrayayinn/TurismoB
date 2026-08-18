/**
 * Etiqueta legible del destino: nombre del sitio + dirección.
 * Evita que Google/OSM etiqueten el pin con un POI vecino (p. ej. Mayorca).
 */
function buildPlaceLabel(site) {
  if (!site) return '';
  const name = typeof site.name === 'string' ? site.name.trim() : '';
  const address = typeof site.address === 'string' ? site.address.trim() : '';
  return [name, address].filter(Boolean).join(', ');
}

function parseCoords(site) {
  const lat = site?.lat != null && site.lat !== '' ? Number(site.lat) : NaN;
  const lng = site?.lng != null && site.lng !== '' ? Number(site.lng) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  return { lat, lng, hasCoords };
}

/**
 * Construye una URL de Google Maps Directions (abre la app en móvil / la web en desktop).
 * Prefiere el nombre+dirección del sitio para que el destino se llame igual que la ficha.
 * @param {{ name?: string, lat?: number|string, lng?: number|string, address?: string }} site
 * @param {'walk'|'car'} mode
 * @param {{ lat: number, lng: number }|null} origin - ubicación real del usuario (opcional)
 * @returns {string|null}
 */
export function buildGoogleMapsDirectionsUrl(site, mode = 'walk', origin = null) {
  if (!site) return null;

  const { lat, lng, hasCoords } = parseCoords(site);
  const label = buildPlaceLabel(site);

  if (!label && !hasCoords) return null;

  const params = new URLSearchParams({ api: '1' });
  // Nombre + dirección primero: Google muestra ese título en lugar de un POI cercano.
  // Si no hay texto, se usan solo las coordenadas.
  params.set('destination', label || `${lat},${lng}`);
  params.set('travelmode', mode === 'walk' ? 'walking' : 'driving');

  if (
    origin &&
    Number.isFinite(Number(origin.lat)) &&
    Number.isFinite(Number(origin.lng))
  ) {
    params.set('origin', `${Number(origin.lat)},${Number(origin.lng)}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * URL de mapa embebido (iframe) sin Maps JavaScript API ni clave de facturación.
 * Usa el nombre del sitio en la búsqueda para que el pin coincida con la ficha.
 * Si hay coords, el embed de Google las usa como respaldo de precisión vía query.
 * @param {{ lat?: number|string, lng?: number|string, address?: string, name?: string }} site
 * @returns {string|null}
 */
export function buildGoogleMapsEmbedUrl(site) {
  if (!site) return null;

  const { lat, lng, hasCoords } = parseCoords(site);
  const label = buildPlaceLabel(site);

  if (!label && !hasCoords) return null;

  // Query con nombre (+ dirección). Si además hay coords, se anexan para afinar el pin
  // sin perder el título del lugar turístico.
  let q = label;
  if (!q && hasCoords) q = `${lat},${lng}`;
  else if (label && hasCoords) q = `${label} @${lat},${lng}`;

  const params = new URLSearchParams({
    q,
    z: '16',
    hl: 'es',
    output: 'embed',
  });

  return `https://maps.google.com/maps?${params.toString()}`;
}
