// backend/src/db.js
// Capa de acceso a base de datos (MySQL o SQLite): pool de conexiones/conexión local,
// creación del esquema y del super-administrador inicial.
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { config } from './config.js';

let pool = null;
let sqliteDb = null;
const useSqlite = config.dbType === 'sqlite';

/** Devuelve el pool de conexiones MySQL (debe llamarse a initDb antes). */
export function getPool() {
  if (!useSqlite && !pool) {
    throw new Error('El pool de base de datos MySQL no está inicializado. Llama a initDb() primero.');
  }
  return pool;
}

/** Helper para traducir consultas MySQL específicas a sintaxis compatible con SQLite */
function translateMysqlToSqlite(sql) {
  let s = sql;
  
  // ON DUPLICATE KEY UPDATE para la tabla settings
  s = s.replace(
    /ON DUPLICATE KEY UPDATE\s+(\w+)\s*=\s*VALUES\(\1\)/gi,
    'ON CONFLICT(setting_key) DO UPDATE SET $1 = excluded.$1'
  );
  
  // Stats queries translation
  // Query 1: YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
  s = s.replace(
    /YEAR\(created_at\)\s*=\s*YEAR\(CURDATE\(\)\)\s*AND\s*MONTH\(created_at\)\s*=\s*MONTH\(CURDATE\(\)\)/gi,
    "strftime('%Y', created_at) = strftime('%Y', 'now') AND strftime('%m', created_at) = strftime('%m', 'now')"
  );

  // Query 2: YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)
  s = s.replace(
    /YEAR\(created_at\)\s*=\s*YEAR\(CURDATE\(\)\s*-\s*INTERVAL\s*1\s*MONTH\)\s*AND\s*MONTH\(created_at\)\s*=\s*MONTH\(CURDATE\(\)\s*-\s*INTERVAL\s*1\s*MONTH\)/gi,
    "strftime('%Y', created_at) = strftime('%Y', 'now', '-1 month') AND strftime('%m', created_at) = strftime('%m', 'now', '-1 month')"
  );

  // Query 3: DATE(created_at) AS d, COUNT(*) AS c FROM visit_log WHERE created_at >= CURDATE() - INTERVAL 6 DAY GROUP BY DATE(created_at)
  s = s.replace(/DATE\(created_at\)/gi, "date(created_at)");
  s = s.replace(/CURDATE\(\)\s*-\s*INTERVAL\s*6\s*DAY/gi, "date('now', '-6 day')");

  // Query 4: FLOOR(DATEDIFF(CURDATE(), DATE(created_at)) / 7) AS wk, COUNT(*) AS c FROM visit_log WHERE created_at >= CURDATE() - INTERVAL 27 DAY GROUP BY wk
  s = s.replace(
    /FLOOR\(DATEDIFF\(CURDATE\(\),\s*DATE\(created_at\)\)\s*\/\s*7\)/gi,
    "CAST((julianday('now') - julianday(created_at)) / 7 AS INT)"
  );
  s = s.replace(/CURDATE\(\)\s*-\s*INTERVAL\s*27\s*DAY/gi, "date('now', '-27 day')");

  // Query 5: MONTH(created_at) AS m, COUNT(*) AS c FROM visit_log WHERE YEAR(created_at) = YEAR(CURDATE()) GROUP BY MONTH(created_at)
  s = s.replace(/MONTH\(created_at\)/gi, "CAST(strftime('%m', created_at) AS INTEGER)");
  s = s.replace(/YEAR\(created_at\)\s*=\s*YEAR\(CURDATE\(\)\)/gi, "strftime('%Y', created_at) = strftime('%Y', 'now')");

  return s;
}

/** Helper de consulta unificado (MySQL o SQLite). Devuelve las filas para SELECT, o metadatos de inserción. */
export async function query(sql, params = []) {
  if (useSqlite) {
    if (!sqliteDb) {
      throw new Error('La base de datos SQLite no está inicializada. Llama a initDb() primero.');
    }
    const cleanSql = translateMysqlToSqlite(sql);
    const stmt = sqliteDb.prepare(cleanSql);
    const lower = sql.trim().toLowerCase();
    
    if (lower.startsWith('select') || lower.startsWith('pragma') || lower.startsWith('show')) {
      const rows = stmt.all(...params);
      return rows;
    } else {
      const res = stmt.run(...params);
      return {
        insertId: Number(res.lastInsertRowid),
        affectedRows: res.changes
      };
    }
  } else {
    const [rows] = await getPool().execute(sql, params);
    return rows;
  }
}

const MYSQL_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('superadmin','admin') NOT NULL DEFAULT 'admin',
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS sites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    category VARCHAR(60) NOT NULL DEFAULT 'Comercio',
    zone VARCHAR(80) NOT NULL DEFAULT '',
    description TEXT,
    images JSON,
    rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
    address VARCHAR(255) NOT NULL DEFAULT '',
    lat DECIMAL(10,7),
    lng DECIMAL(10,7),
    hours VARCHAR(120) DEFAULT '',
    phone VARCHAR(60) DEFAULT '',
    instagram VARCHAR(255) DEFAULT '',
    facebook VARCHAR(255) DEFAULT '',
    website VARCHAR(255) DEFAULT '',
    tags JSON,
    visits INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    date VARCHAR(120) NOT NULL DEFAULT '',
    zone VARCHAR(80) DEFAULT '',
    image TEXT,
    cta VARCHAR(120) DEFAULT 'Más información',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    start_time VARCHAR(5) DEFAULT '',
    end_time VARCHAR(5) DEFAULT '',
    location VARCHAR(200) DEFAULT '',
    description TEXT,
    source VARCHAR(20) NOT NULL DEFAULT 'manual',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS pqrs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('inclusion','update','pqrs') NOT NULL DEFAULT 'pqrs',
    name VARCHAR(160) NOT NULL,
    email VARCHAR(160) NOT NULL,
    subject VARCHAR(255) NOT NULL DEFAULT '',
    details TEXT,
    status ENUM('pending','validated','rejected') NOT NULL DEFAULT 'pending',
    meta JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(80) PRIMARY KEY,
    setting_value TEXT,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  `CREATE TABLE IF NOT EXISTS visit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    site_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_visit_log_created (created_at),
    INDEX idx_visit_log_site (site_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

const SQLITE_SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Comercio',
    zone TEXT NOT NULL DEFAULT '',
    description TEXT,
    images TEXT,
    rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
    address TEXT NOT NULL DEFAULT '',
    lat DECIMAL(10,7),
    lng DECIMAL(10,7),
    hours TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    instagram TEXT DEFAULT '',
    facebook TEXT DEFAULT '',
    website TEXT DEFAULT '',
    tags TEXT,
    visits INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL DEFAULT '',
    zone TEXT DEFAULT '',
    image TEXT,
    cta TEXT DEFAULT 'Más información',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TEXT DEFAULT '',
    end_time TEXT DEFAULT '',
    location TEXT DEFAULT '',
    description TEXT,
    source TEXT NOT NULL DEFAULT 'manual',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS pqrs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL DEFAULT 'pqrs',
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    details TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    meta TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS visit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_visit_log_created ON visit_log(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_visit_log_site ON visit_log(site_id)`
];

/**
 * Crea la base de datos (MySQL o SQLite), el esquema de tablas y el super-admin
 * inicial. Es idempotente: se puede llamar en cada arranque sin efectos.
 */
export async function initDb() {
  if (useSqlite) {
    const { DatabaseSync } = await import('node:sqlite');
    sqliteDb = new DatabaseSync(config.dbSqlitePath);
    for (const stmt of SQLITE_SCHEMA_STATEMENTS) {
      sqliteDb.exec(stmt);
    }
    console.log('[db] SQLite inicializado localmente.');
    await seedInitialAdmin();
    return;
  }

  // 1) Conexión sin base de datos para crearla si hace falta.
  const bootstrap = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: false,
  });
  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await bootstrap.end();

  // 2) Pool ya apuntando a la base de datos.
  pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  });

  // 3) Tablas.
  for (const stmt of MYSQL_SCHEMA_STATEMENTS) {
    await pool.query(stmt);
  }

  // 4) Super-admin inicial.
  await seedInitialAdmin();
}

async function seedInitialAdmin() {
  const rows = await query('SELECT COUNT(*) AS total FROM users');
  if (rows[0].total > 0) return;

  const { username, password, name } = config.seedAdmin;
  const hash = await bcrypt.hash(password, 12);
  await query(
    'INSERT INTO users (username, name, password_hash, role) VALUES (?, ?, ?, ?)',
    [username, name, hash, 'superadmin']
  );
  console.log(`[db] Super-administrador inicial creado: "${username}". Cambia la contraseña tras el primer inicio de sesión.`);
}
