// backend/src/config.js
// Carga y centraliza la configuración de entorno. Un único punto de verdad
// para el resto del backend, con valores por defecto seguros para desarrollo.
import 'dotenv/config';

const required = (name, value) => {
  if (!value) {
    console.warn(`[config] Falta la variable de entorno ${name}; usando valor por defecto de desarrollo.`);
  }
  return value;
};

export const config = {
  port: Number(process.env.PORT) || 3001,
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  publicUrl: (process.env.PUBLIC_URL || 'http://localhost:3001').replace(/\/$/, ''),

  dbType: process.env.DB_TYPE || 'mysql',
  dbSqlitePath: process.env.DB_SQLITE_PATH || 'turismo_itagui.db',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'turismo_itagui',
  },

  jwt: {
    secret: required('JWT_SECRET', process.env.JWT_SECRET) || 'dev-secreto-inseguro-cambiar',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  seedAdmin: {
    username: process.env.SEED_ADMIN_USERNAME || 'admin',
    password: process.env.SEED_ADMIN_PASSWORD || 'Itagui2026*Cambiar',
    name: process.env.SEED_ADMIN_NAME || 'Administrador Principal',
  },

  isProduction: process.env.NODE_ENV === 'production',
};
