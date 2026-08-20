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

/**
 * Destino para Google Maps Directions.
 * - compact=false (PC): nombre + dirección.
 * - compact=true (móvil): solo nombre; si falta, solo dirección.
 * @returns {{ text: string|null, hasCoords: boolean, lat: number, lng: number }}
 */
function buildDestinationQuery(site, { compact = false } = {}) {
  const { lat, lng, hasCoords } = parseCoords(site);
  const name = typeof site?.name === 'string' ? site.name.trim() : '';
  const address = typeof site?.address === 'string' ? site.address.trim() : '';

  let text = null;
  if (compact) {
    text = name || address || null;
  } else {
    text = buildPlaceLabel(site) || null;
  }

  return { text, hasCoords, lat, lng };
}

function parseCoords(site) {
  const lat = site?.lat != null && site.lat !== '' ? Number(site.lat) : NaN;
  const lng = site?.lng != null && site.lng !== '' ? Number(site.lng) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  return { lat, lng, hasCoords };
}

/**
 * Construye una URL de Google Maps Directions (abre la app en móvil / la web en desktop).
 * En móvil (`compact: true`) solo envía el nombre (o la dirección) para que la app
 * pueda resolver el destino; en escritorio mantiene nombre + dirección.
 * @param {{ name?: string, lat?: number|string, lng?: number|string, address?: string }} site
 * @param {'walk'|'car'} mode
 * @param {{ lat: number, lng: number }|null} origin - ubicación real del usuario (opcional)
 * @param {{ compact?: boolean }} options
 * @returns {string|null}
 */
export function buildGoogleMapsDirectionsUrl(site, mode = 'walk', origin = null, options = {}) {
  if (!site) return null;

  const { compact = false } = options;
  const { text, hasCoords, lat, lng } = buildDestinationQuery(site, { compact });

  if (!text && !hasCoords) return null;

  const params = new URLSearchParams({ api: '1' });
  params.set('destination', text || `${lat},${lng}`);
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
