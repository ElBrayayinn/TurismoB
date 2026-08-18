// backend/src/index.js
// Punto de entrada del backend: configura Express, middleware de seguridad,
// monta los routers de la API y arranca tras inicializar la base de datos.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { config } from './config.js';
import { initDb } from './db.js';
import { UPLOADS_DIR } from './middleware/upload.js';

import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { sitesRouter } from './routes/sites.js';
import { announcementsRouter } from './routes/announcements.js';
import { eventsRouter } from './routes/events.js';
import { pqrsRouter } from './routes/pqrs.js';
import { settingsRouter } from './routes/settings.js';
import { uploadRouter } from './routes/upload.js';
import { statsRouter } from './routes/stats.js';
import { geocodeRouter } from './routes/geocode.js';
import { googleCalendarRouter } from './routes/googleCalendar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build del frontend. En el despliegue monolítico (Railway) la API y la SPA
// comparten un mismo origen: este servidor sirve frontend/dist si existe.
// En desarrollo la carpeta no existe y Vite se encarga del frontend.
const FRONTEND_DIST = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
const serveFrontend = fs.existsSync(path.join(FRONTEND_DIST, 'index.html'));

const app = express();

// Railway (y cualquier reverse proxy) envía X-Forwarded-For. Sin trust proxy,
// express-rate-limit aborta el proceso al primer request (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR).
app.set('trust proxy', 1);

// Seguridad de cabeceras. Se permite el uso cruzado de recursos para que el
// frontend (otro origen en desarrollo) pueda cargar las imágenes de /uploads.
// frame-src: el mapa de ficha se embebe por iframe (OSM / Google), no con la
// Maps JavaScript API — sin esto Helmet (default-src 'self') lo deja en negro.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      frameSrc: [
        "'self'",
        'https://www.openstreetmap.org',
        'https://maps.google.com',
        'https://www.google.com',
      ],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://images.unsplash.com',
        'https://upload.wikimedia.org',
        'https://*.basemaps.cartocdn.com',
        'https://*.tile.openstreetmap.org',
      ],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
      connectSrc: [
        "'self'",
        'https://nominatim.openstreetmap.org',
      ],
      upgradeInsecureRequests: [],
    },
  },
}));

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '2mb' }));

// Archivos estáticos subidos (imágenes de sitios, anuncios y PQRS).
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' }));

// Activos estáticos de la SPA (JS/CSS con hash en el nombre → caché larga).
if (serveFrontend) {
  app.use(express.static(FRONTEND_DIST, { maxAge: '1y', index: false }));
}

// Sonda de salud.
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// API.
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/sites', sitesRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/pqrs', pqrsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/stats', statsRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/google-calendar', googleCalendarRouter);

// 404 para rutas de API desconocidas.
app.use('/api', (_req, res) => res.status(404).json({ error: 'Recurso no encontrado.' }));

// Enrutado del lado del cliente: cualquier otra ruta devuelve index.html para
// que React Router resuelva la vista. Sin caché, para que un nuevo despliegue
// se vea de inmediato.
if (serveFrontend) {
  app.get('*', (_req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

// Manejo centralizado de errores (incluye errores de multer y de validación).
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError || /imagen/i.test(err?.message || '')) {
    return res.status(400).json({ error: err.message });
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

async function start() {
  try {
    await initDb();
    console.log('[db] Base de datos lista.');
  } catch (err) {
    console.error('[db] No se pudo conectar/inicializar MySQL:', err.message);
    console.error('     Verifica que MySQL esté corriendo y las credenciales en backend/.env.');
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`Backend de Turismo Itagüí escuchando en http://localhost:${config.port}`);
    console.log(`CORS permitido para: ${config.corsOrigin.join(', ')}`);
  });
}

start();
