import { useContext } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import { AppProvider } from './contexto/AppProvider';
import { AppContext } from './contexto/AppContext';
import { Header } from './componentes/estructura/Header';
import { Footer } from './componentes/estructura/Footer';
import { ScrollToTop } from './componentes/estructura/ScrollToTop';
import { Home } from './paginas/Home';
import { SiteDetailPage } from './paginas/SiteDetailPage';
import { AdminPage } from './paginas/AdminPage';
import { PqrsPage } from './paginas/PqrsPage';
import { CalendarPage } from './paginas/CalendarPage';
import { RouteModal } from './componentes/detalle/RouteModal';
import { useGeolocation } from './hooks/useGeolocation';
import { InteractiveMap } from './componentes/detalle/InteractiveMap';

// Estilos globales
import './estilos/variables.css';
import './estilos/global.css';
import './estilos/animations.css';

// Rutas con transición suave: la key por pathname re-monta el contenedor
// en cada navegación, re-disparando la animación de entrada.
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-transition">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/site/:id" element={<SiteDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/pqrs" element={<PqrsPage />} />
      </Routes>
    </div>
  );
}

function AppContent() {
  const { 
    activeRouteSite, 
    isRouteOpen, 
    setIsRouteOpen,
    setActiveRouteSite,
    isRouteMapOpen,
    setIsRouteMapOpen,
    activeRouteMode
  } = useContext(AppContext);

  const { position: userPosition, isSimulated: userLocationSimulated } = useGeolocation();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <main style={{ flex: 1 }}>
        <AnimatedRoutes />
      </main>
      <Footer />

      {/* Mapa de Ruta Completo en Pantalla Completa */}
      {isRouteMapOpen && activeRouteSite && (
        <div className="full-route-map-overlay">
          <InteractiveMap 
            site={activeRouteSite}
            userPosition={userPosition}
            showRoute={true}
            routeMode={activeRouteMode}
          />
        </div>
      )}

      {/* Isla Dinámica de Ruta Global que persiste en todas las vistas */}
      {activeRouteSite && (
        <RouteModal 
          isOpen={isRouteOpen} 
          onClose={() => {
            setIsRouteOpen(false);
            setActiveRouteSite(null);
            setIsRouteMapOpen(false);
          }} 
          site={activeRouteSite}
          userPosition={userPosition}
          userLocationSimulated={userLocationSimulated}
        />
      )}
    </BrowserRouter>
  );
}

function App() {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} region="CO" language="es">
      <AppProvider>
        <AppContent />
      </AppProvider>
    </APIProvider>
  );
}

export default App;
