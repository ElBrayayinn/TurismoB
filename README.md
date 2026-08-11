# Turismo Itagüí por Alcaldia de Itagüí 
Aplicativo web desarrollado por la Alcaldía de Itagüí para promover el turismo local, ofreciendo información detallada y ubicación geográfica de sitios turísticos y de interés en el municipio.

---
# Descripción

Este repositorio contiene el código fuente de la aplicación, dividida en un entorno de **Frontend** (`frontend/`) y un **Backend** mínimo (`backend/`).

El objetivo principal es brindar a los ciudadanos y turistas un catálogo interactivo de sitios y rutas de interés, un **calendario de eventos** municipales, un panel de administración y un sistema de recepción de PQRS.

El estado de la aplicación (sitios, anuncios, eventos manuales, PQRS) se persiste en el `localStorage` del navegador. El backend, por ahora, cumple una única función: actuar de **proxy del calendario compartido (`.ics`) de Google Calendar**, resolviendo el bloqueo de CORS que impide leerlo directamente desde el navegador.

---
# Tecnologias

- **React 19:** Biblioteca principal para la construcción de la interfaz de usuario.
- **Vite:** Entorno de desarrollo y herramienta de construcción ultra rápida.
- **React Router DOM:** Manejo de rutas y navegación en la aplicación (`/`, `/calendario`, `/site/:id`, `/admin`, `/pqrs`).
- **Leaflet & React Leaflet:** Renderizado de mapas interactivos y marcadores geográficos.
- **Recharts:** Visualización de gráficos y métricas (utilizado en el Dashboard de administración).
- **React Icons:** Iconografía a lo largo de toda la interfaz.
- **CSS Vanilla:** Estilos modulares organizados por componente y con variables globales para temas consistentes.
- **Node.js + Express (backend):** Proxy del calendario `.ics` de Google, con `node-ical` para parsear los eventos.

---
# Ejecución

**Frontend** (`frontend/`):
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

**Backend** (`backend/`) — necesario solo para la integración con Google Calendar:
```bash
cd backend
npm install
cp .env.example .env
npm run dev        # http://localhost:3001
```

El frontend toma la URL del backend de `VITE_API_URL` (ver `frontend/.env.example`); por defecto `http://localhost:3001`.

## Sección Calendario

`/calendario` muestra una cuadrícula mensual con los eventos de la oficina de comunicación. Los eventos provienen de tres fuentes:
1. **Manuales:** creados desde el panel de administrador (pestaña *Calendario*).
2. **Excel:** importación masiva — *UI preparada, pendiente de definir los campos del archivo*.
3. **Google Calendar:** se pega la URL pública `.ics` del calendario compartido en el panel de administrador; el backend la descarga y parsea. Requiere el backend en ejecución.

---
# Arquitectura 

La aplicación principal se encuentra alojada en el directorio `frontend/`. 
La estructura del código fuente (dentro de `frontend/src/`) está diseñada de forma escalable:

```text
src/
├── assets/       # Recursos estáticos (imágenes, logotipos, etc.)
├── components/   # Componentes reutilizables agrupados por dominio
│   ├── admin/    # Gráficos, métricas y tablas para el dashboard
│   ├── common/   # Componentes genéricos (botones, inputs, modales)
│   ├── detail/   # Elementos de la vista de detalle de un sitio (galería, mapa de ruta)
│   ├── home/     # Filtros y listas de la página principal
│   └── layout/   # Elementos estructurales base (Header, Footer)
├── context/      # Estados globales y providers de React (ej. AppContext)
├── data/         # Datos estáticos o mock data (sitios turísticos, anuncios)
├── hooks/        # Custom hooks con lógica reutilizable
├── pages/        # Componentes que actúan como vistas enrutables (Home, Admin, Pqrs, Detail)
├── styles/       # Hojas de estilo globales y tokens de diseño
└── utils/        # Funciones auxiliares y helpers
```

---
# Licencia
Copyright (C) 2026, Alcaldia de Itagüí, Antioquia, Colombia . Todos los derechos reservados.

Queda estrictamente prohibida la reproducción, distribución, modificación o comercialización 
total o parcial de este código fuente sin la autorización expresa y por escrito del titular del copyright.

`
Desarrollador a cargo: Gabriel Durango M - FullStack Developer
`
