# Guía de Implementación: Rutas Reales con ArcGIS y Leaflet

Este documento detalla la arquitectura, los requisitos y el código necesario para implementar rutas geográficas reales (siguiendo calles y avenidas de Itagüí) en el portal turístico. Se aprovecha la licencia existente de ArcGIS combinada con la interfaz ligera de Leaflet (`react-leaflet`).

---

## 🧭 Concepto General

Para mantener el portal rápido, responsivo y compatible con temas claro/oscuro de CartoDB, **no** instalaremos el SDK completo de ArcGIS JS. En su lugar:
1. Usamos el componente actual de **Leaflet** para pintar el mapa.
2. Consumimos el **ArcGIS Routing Service REST API** mediante peticiones HTTP estándar (`fetch`).
3. Pintamos la línea del camino real sobre Leaflet usando un componente `<Polyline>`.
4. Mostramos las instrucciones giro a giro ("Gire a la izquierda...", "Avance 100m") en una lista de la interfaz.

---

## 🔑 Requisitos

1. **API Key de ArcGIS:** Debes contar con un token activo de tu suscripción de desarrollador o empresarial de ArcGIS.
2. **Ubicación del Usuario:** El navegador requiere permisos de geolocalización (obtenidos a través del hook `useGeolocation`).
3. **Ubicación del Sitio:** Coordenadas de latitud y longitud del sitio turístico (disponibles en `AppContext` de cada destino).

---

## 📡 Detalle del Servicio REST de ArcGIS

La petición se realiza al endpoint de resolución de rutas:

```http
GET https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World/solve
```

### Parámetros Principales de la Query
*   **`stops`**: Las coordenadas de los puntos de control en formato `Long,Lat;Long,Lat` (ej. `-75.6091,6.1724;-75.5988,6.1758`). **Importante:** ArcGIS usa formato `X,Y` (Longitud primero, luego Latitud), mientras que Leaflet usa `[Latitud, Longitud]`.
*   **`token`**: Tu API Key de ArcGIS.
*   **`travelMode`**: Modo de desplazamiento. Opciones comunes:
    *   `"Walking Time"` o `"Walking Distance"` (Rutear a pie).
    *   `"Driving Time"` o `"Driving Distance"` (Rutear en coche).
*   **`f`**: Formato de retorno de datos. Usar `"json"`.

---

## 💻 Código del Componente de Ruta (`ArcGISRoute.jsx`)

Crea este componente en `src/components/detail/ArcGISRoute.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

export const ArcGISRoute = ({ userCoords, siteCoords, apiKey, travelMode = 'Walking Time', onRouteCalculated }) => {
  const [routePath, setRoutePath] = useState([]);
  const [loading, setLoading] = useState(false);
  const map = useMap();

  useEffect(() => {
    if (!userCoords || !siteCoords || !apiKey) return;

    setLoading(true);
    
    // ArcGIS REST requiere: Longitud,Latitud;Longitud,Latitud
    const origin = `${userCoords.lng},${userCoords.lat}`;
    const destination = `${siteCoords.lng},${siteCoords.lat}`;
    const stops = `${origin};${destination}`;

    const url = `https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World/solve` +
                `?stops=${encodeURIComponent(stops)}` +
                `&token=${apiKey}` +
                `&travelMode=${encodeURIComponent(travelMode)}` +
                `&f=json`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes.features.length > 0) {
          // 1. Extraer los puntos del camino (geometry.paths es una matriz 3D)
          const paths = data.routes.features[0].geometry.paths[0];
          
          // Convertir de [Long, Lat] (ArcGIS) a [Lat, Long] (Leaflet)
          const leafletCoords = paths.map(point => [point[1], point[0]]);
          setRoutePath(leafletCoords);

          // 2. Extraer instrucciones de navegación paso a paso
          let steps = [];
          let totalTime = 0;
          let totalDistance = 0; // en metros o kilómetros

          if (data.directions && data.directions.length > 0) {
            const directionFeature = data.directions[0];
            totalTime = directionFeature.summary.totalTime; // en minutos
            totalDistance = directionFeature.summary.totalLength; // en las unidades de la ruta (millas o km)
            steps = directionFeature.features.map(feat => ({
              text: feat.attributes.text,
              length: feat.attributes.length,
              time: feat.attributes.time
            }));
          }

          // Notificar al componente padre de la información calculada
          if (onRouteCalculated) {
            onRouteCalculated({
              steps,
              time: totalTime,
              distance: totalDistance
            });
          }

          // 3. Auto-enfocar la cámara del mapa sobre toda la extensión del recorrido
          const bounds = L.latLngBounds(leafletCoords);
          map.fitBounds(bounds, { padding: [40, 40] });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al resolver ruta en ArcGIS Routing Service:", err);
        setLoading(false);
      });

  }, [userCoords, siteCoords, apiKey, travelMode, map]);

  return routePath.length > 0 ? (
    <Polyline 
      positions={routePath} 
      color="#E8B400" // Dorado institucional de la Alcaldía
      weight={6} 
      opacity={0.85} 
    />
  ) : null;
};
```

---

## 🎛️ Pasos para Integrarlo en la Web

### Paso 1: Agregar el Componente de Ruta en el Mapa Interactivo
En tu archivo [InteractiveMap.jsx](file:///c:/Users/Usuario/Desktop/Mockup%20Turismo/src/components/detail/InteractiveMap.jsx), importa y renderiza el componente dentro del contenedor de Leaflet `<MapContainer>` cuando exista una ruta activa:

```jsx
{userPosition && (
  <ArcGISRoute 
    userCoords={userPosition} 
    siteCoords={coordinates} // Coordenadas del sitio turístico
    apiKey="TU_API_KEY_DE_ARCGIS"
    travelMode="Walking Time" 
    onRouteCalculated={(info) => {
      console.log(`Distancia: ${info.distance} km, Tiempo: ${info.time} min`);
      // Aquí puedes guardar la info en el estado para mostrarla al usuario
    }}
  />
)}
```

### Paso 2: Integrar la Vista Giro a Giro en la Modal de Ruta
En [RouteModal.jsx](file:///c:/Users/Usuario/Desktop/Mockup%20Turismo/src/components/detail/RouteModal.jsx), puedes renderizar la lista de indicaciones recibidas en el callback `onRouteCalculated` para que el turista tenga su guía de navegación paso a paso.

---

## 🔄 Alternativa Gratuita de Respaldo (OSRM)

Si por algún motivo necesitas probar rutas reales en entornos de desarrollo sin consumir los créditos de tu licencia de ArcGIS o sin configurar claves, puedes cambiar la petición REST al servicio de demostración de **OSRM**:

```javascript
const origin = `${userCoords.lng},${userCoords.lat}`;
const destination = `${siteCoords.lng},${siteCoords.lat}`;
const url = `https://router.project-osrm.org/route/v1/foot/${origin};${destination}?overview=full&geometries=geojson&steps=true`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    // OSRM devuelve la geometría en formato GeoJSON LineString
    const coords = data.routes[0].geometry.coordinates.map(p => [p[1], p[0]]);
    setRoutePath(coords);
  });
```

*Nota: OSRM es 100% gratuito y no requiere API Key, ideal como mecanismo fallback (respaldo) en caso de que el servidor de ArcGIS falle o no tenga saldo disponible.*
