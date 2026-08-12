import { useContext, lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AppProvider } from './contexto/AppProvider';
import { AppContext } from './contexto/AppContext';
import { Header } from './componentes/estructura/Header';
import { Footer } from './componentes/estructura/Footer';
import { ScrollToTop } from './componentes/estructura/ScrollToTop';
import { ErrorBoundary } from './componentes/comunes/ErrorBoundary';
import { Home } from './paginas/Home';
import { SiteDetailPage } from './paginas/SiteDetailPage';
import { PqrsPage } from './paginas/PqrsPage';
import { CalendarPage } from './paginas/CalendarPage';
import { NotFound } from './paginas/NotFound';
import { RouteModal } from './componentes/detalle/RouteModal';

// Estilos globales
import './estilos/variables.css';
import './estilos/global.css';
import './estilos/animations.css';

// El panel de administración arrastra Recharts y formularios pesados que el
// ciudadano nunca usa. Cargándolo aparte, el paquete inicial del portal público
// baja de forma notable — clave en datos móviles.
const AdminPage = lazy(() => import('./paginas/AdminPage'));

// Rutas con transición suave: la key por pathname re-monta el contenedor
// en cada navegación, re-disparando la animación de entrada.
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition">
      <Suspense fallback={<div className="route-fallback">Cargando sección…</div>}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/site/:id" element={<SiteDetailPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/pqrs" element={<PqrsPage />} />
          {/* Cualquier URL desconocida cae aquí en lugar de dejar la vista vacía. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
}

function AppContent() {
  const {
    activeRouteSite,
    isRouteOpen,
    setIsRouteOpen,
    setActiveRouteSite,
    userPosition,
    userLocationSimulated,
    requestUserLocation,
  } = useContext(AppContext);

  // GPS opcional: si está disponible se envía como origen a Google Maps.
  useEffect(() => {
    if (activeRouteSite) requestUserLocation();
  }, [activeRouteSite, requestUserLocation]);

  return (
    <>
      <ScrollToTop />
      <Header />
      <main id="contenido-principal" className="app-main">
        <AnimatedRoutes />
      </main>
      <Footer />

      {activeRouteSite && (
        <RouteModal
          isOpen={isRouteOpen}
          onClose={() => {
            setIsRouteOpen(false);
            setActiveRouteSite(null);
          }}
          site={activeRouteSite}
          userPosition={userPosition}
          userLocationSimulated={userLocationSimulated}
        />
      )}
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} region="CO" language="es">
        <AppProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AppProvider>
      </APIProvider>
    </ErrorBoundary>
  );
}

export default App;
