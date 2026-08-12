/**
 * Construye una URL de Google Maps Directions (abre la app en móvil / la web en desktop).
 * @param {{ lat?: number|string, lng?: number|string, address?: string }} site
 * @param {'walk'|'car'} mode
 * @param {{ lat: number, lng: number }|null} origin - ubicación real del usuario (opcional)
 * @returns {string|null}
 */
export function buildGoogleMapsDirectionsUrl(site, mode = 'walk', origin = null) {
  if (!site) return null;

  const lat = site.lat != null && site.lat !== '' ? Number(site.lat) : NaN;
  const lng = site.lng != null && site.lng !== '' ? Number(site.lng) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const address = typeof site.address === 'string' ? site.address.trim() : '';

  if (!hasCoords && !address) return null;

  const params = new URLSearchParams({ api: '1' });
  params.set('destination', hasCoords ? `${lat},${lng}` : address);
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
