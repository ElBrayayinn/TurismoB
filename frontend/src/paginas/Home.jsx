import { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../contexto/AppContext';
import { zoneOptions, DEFAULT_ZONE } from '../datos/zones';
import { EventSlider } from '../componentes/inicio/EventSlider';
import { SiteCard } from '../componentes/inicio/SiteCard';
import { SiteCardSkeleton } from '../componentes/inicio/SiteCardSkeleton';
import { 
  RiGridLine, 
  RiLeafLine, 
  RiPaletteLine, 
  RiRestaurantLine, 
  RiBuildingLine, 
  RiStore2Line,
  RiSearchLine,
  RiArrowDownSLine,
  RiErrorWarningLine
} from 'react-icons/ri';
import './Home.css';

const CATEGORIES = [
  { id: 'Todos', name: 'Todos', icon: RiGridLine },
  { id: 'Parque', name: 'Parques', icon: RiLeafLine },
  { id: 'Cultura', name: 'Cultura', icon: RiPaletteLine },
  { id: 'Restaurante', name: 'Gastronomía', icon: RiRestaurantLine },
  { id: 'Museo', name: 'Museos', icon: RiBuildingLine },
  { id: 'Comercio', name: 'Comercio', icon: RiStore2Line }
];

export const Home = () => {
  const { sites, announcements, loading, dataError } = useContext(AppContext);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado para simular la georreferenciación por zonas
  const [currentZone, setCurrentZone] = useState(() => {
    return localStorage.getItem('user_simulated_zone') || DEFAULT_ZONE;
  });

  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);

  // Skeletons de las tarjetas: se muestran mientras el backend responde y, como
  // mínimo, un breve instante para una sensación de carga pulida.
  const [minDelayDone, setMinDelayDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinDelayDone(true), 550);
    return () => clearTimeout(timer);
  }, []);
  const isLoading = loading || !minDelayDone;

  useEffect(() => {
    if (!isZoneDropdownOpen) return;
    const handleClose = () => setIsZoneDropdownOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isZoneDropdownOpen]);

  const handleZoneChange = (zone) => {
    setCurrentZone(zone);
    localStorage.setItem('user_simulated_zone', zone);
  };

  // Filtrar anuncios basados en la zona seleccionada (si el anuncio tiene una zona asociada)
  const displayAnnouncements = useMemo(() => {
    const zoneAnnouncements = announcements.filter(ann => !ann.zone || ann.zone === currentZone);
    return zoneAnnouncements.length > 0 ? zoneAnnouncements : announcements;
  }, [announcements, currentZone]);

  // Sitios de interés sugeridos en la zona actual
  const nearbySites = useMemo(
    () => sites.filter(site => site.zone === currentZone),
    [sites, currentZone]
  );

  // Sitios generales aplicando categoría y búsqueda
  const filteredSites = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sites.filter(site => {
      const matchesCategory = selectedCategory === 'Todos' || site.category === selectedCategory;
      const matchesSearch = !query ||
        (site.name || '').toLowerCase().includes(query) ||
        (site.description || '').toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [sites, selectedCategory, searchQuery]);

  return (
    <div className="home-section container">

      {/* Si el backend no responde, se dice claramente en lugar de mostrar
          "no se encontraron sitios", que sugiere que no hay contenido. */}
      {dataError && (
        <p className="app-data-error" role="alert">
          <RiErrorWarningLine aria-hidden="true" />
          <span>
            No fue posible cargar la información del portal: {dataError} Intenta
            recargar la página en unos minutos.
          </span>
        </p>
      )}

      {/* SIMULADOR DE GEORREFERENCIACIÓN */}
      {/* Carrusel de Anuncios Priorizado por Zona */}
      <div className="announcements-section">
        <div className="announcements-section__header">
          {/* Badge de zona que actúa como selector de comuna */}
          <div className="custom-dropdown zone-badge-dropdown" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={`section-badge zone-badge-trigger ${isZoneDropdownOpen ? 'open' : ''}`}
              onClick={() => setIsZoneDropdownOpen(!isZoneDropdownOpen)}
              aria-expanded={isZoneDropdownOpen}
              aria-haspopup="listbox"
            >
              <span>Zona actual: {currentZone}</span>
              <RiArrowDownSLine className={`dropdown-arrow ${isZoneDropdownOpen ? 'open' : ''}`} aria-hidden="true" />
            </button>
            {isZoneDropdownOpen && (
              <div className="custom-dropdown-menu zone-badge-menu" role="listbox" aria-label="Elegir comuna">
                {zoneOptions.map(opt => (
                  <button
                    type="button"
                    key={opt.value}
                    role="option"
                    aria-selected={currentZone === opt.value}
                    className={`custom-dropdown-option ${currentZone === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      handleZoneChange(opt.value);
                      setIsZoneDropdownOpen(false);
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <EventSlider announcements={displayAnnouncements} />
      </div>

      {/* Sugerencias de Sitios Cercanos (Georreferenciación) */}
      <div className="nearby-suggestions-section">
        <div className="home-section__header">
          <h3 className="home-section__title-double">Sugerencias Cercanas en {currentZone}</h3>
          <p className="home-section__subtitle">Descubrimientos a la mano en tu sector actual.</p>
        </div>
        
        {isLoading ? (
          <div className="sites-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <SiteCardSkeleton key={i} />
            ))}
          </div>
        ) : nearbySites.length > 0 ? (
          <div className="sites-grid">
            {nearbySites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        ) : (
          <div className="empty-state-zone">
            <p>No hay sitios registrados en esta zona de Itagüí. ¡Explora otras comunas simulando tu ubicación con el selector!</p>
          </div>
        )}
      </div>

      {/* Búsqueda General */}
      <div className="home-section__header main-explorer-title">
        <h3 className="home-section__title-double">Explorador General</h3>
      </div>

      {/* Categorías y Barra de Búsqueda de Filtro (Stitch Style) */}
      <div className="category-search-section">
        <div className="category-filters" role="group" aria-label="Filtrar por categoría">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                className={`filter-btn ${selectedCategory === cat.id ? 'filter-btn--active' : ''}`}
                aria-pressed={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <Icon size={16} aria-hidden="true" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        <div className="search-bar">
          <RiSearchLine className="search-bar-icon" aria-hidden="true" />
          <label className="sr-only" htmlFor="buscar-sitio">Buscar un sitio turístico</label>
          <input
            id="buscar-sitio"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="¿Qué buscas explorar?"
            className="search-input"
          />
        </div>
      </div>

      {/* Grid de Sitios Generales */}
      {isLoading ? (
        <div className="sites-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <SiteCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredSites.length > 0 ? (
        <div className="sites-grid">
          {filteredSites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h4>No se encontraron sitios</h4>
          <p>No hay destinos registrados que coincidan con tu búsqueda en "{selectedCategory}".</p>
        </div>
      )}
    </div>
  );
};

export default Home;
