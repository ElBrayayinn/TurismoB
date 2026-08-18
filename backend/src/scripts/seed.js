// backend/src/scripts/seed.js
// Datos semilla del portal: sitios turísticos reales de Itagüí, anuncios y
// eventos de ejemplo. Es idempotente (busca por nombre/título y actualiza en
// lugar de duplicar), así que se puede ejecutar en cada despliegue.
//
//   npm run seed            → inserta/actualiza las semillas
//   npm run seed -- --reset → borra las semillas anteriores y las vuelve a crear
//
// NOTA: las direcciones, horarios y calificaciones son valores de referencia
// para poblar el portal; el administrador debe verificarlos antes de publicar.
import { initDb, query } from '../db.js';

const IMG = 'https://upload.wikimedia.org/wikipedia/commons';

// Fechas relativas al momento de la siembra, para que el calendario siempre
// muestre eventos próximos sin tener que reeditar el script.
const hoy = new Date();
const enDias = (n) => {
  const d = new Date(hoy);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ─── Sitios ─────────────────────────────────────────────────
const SITES = [
  {
    name: 'Parque Principal Simón Bolívar',
    category: 'Parque',
    zone: 'Comuna 1',
    description:
      'El corazón de Itagüí y punto de encuentro de la vida ciudadana. Rodeado de palmas, bancas y el atrio de la iglesia parroquial, concentra el comercio tradicional del centro y es escenario de retretas, ferias artesanales y las principales celebraciones del municipio.',
    images: [
      `${IMG}/thumb/b/be/Panoramica_Itag%C3%BC%C3%AD.jpg/1280px-Panoramica_Itag%C3%BC%C3%AD.jpg`,
      `${IMG}/9/9e/Las_Fiestas_de_la_Industria_el_Comercio_y_la_Cultura_%28Itag%C3%BC%C3%AD%29.jpg`,
    ],
    rating: 4.6,
    address: 'Calle 51 con Carrera 51, Centro, Itagüí',
    lat: 6.1719,
    lng: -75.6113,
    hours: 'Abierto todos los días, 24 horas',
    website: 'https://www.itagui.gov.co',
    tags: ['centro histórico', 'punto de encuentro', 'ferias', 'acceso libre'],
  },
  {
    name: 'Parque Ditaires',
    category: 'Parque',
    zone: 'Comuna 3',
    description:
      'El pulmón verde más grande de Itagüí y su espacio recreativo emblemático: lago, senderos arbolados, canchas, piscinas, gimnasio al aire libre y amplias zonas de picnic. Es el destino favorito de las familias los fines de semana y sede de eventos deportivos del área metropolitana.',
    images: [
      `${IMG}/thumb/3/37/Parque_Ditaires.jpg/1280px-Parque_Ditaires.jpg`,
      `${IMG}/thumb/a/a9/Inmersion_Ditaires.jpg/1280px-Inmersion_Ditaires.jpg`,
    ],
    rating: 4.8,
    address: 'Carrera 42 # 77 Sur - 40, Ditaires, Itagüí',
    // Nominatim / OSM: complejo recreativo Ditaires (NO el CC Mayorca).
    lat: 6.1686106,
    lng: -75.6284155,
    hours: 'Martes a domingo, 6:00 a.m. - 6:00 p.m.',
    website: 'https://www.itagui.gov.co',
    tags: ['naturaleza', 'deporte', 'familiar', 'lago', 'senderos'],
  },
  {
    name: 'Centro de Convenciones y Exposiciones Ditaires',
    category: 'Entretenimiento',
    zone: 'Comuna 3',
    description:
      'Recinto ferial y de espectáculos ubicado dentro del complejo Ditaires. Acoge ferias empresariales, congresos, conciertos y las muestras comerciales más grandes del sur del Valle de Aburrá, con capacidad para varios miles de asistentes.',
    images: [
      `${IMG}/thumb/3/3a/Convenciones_Ditaires_2.jpg/1280px-Convenciones_Ditaires_2.jpg`,
      `${IMG}/thumb/b/b1/Convenciones_Ditaires_3.jpg/1280px-Convenciones_Ditaires_3.jpg`,
    ],
    rating: 4.5,
    address: 'Complejo Ditaires, Carrera 42, Itagüí',
    lat: 6.1684092,
    lng: -75.6282085,
    hours: 'Según programación de eventos',
    website: 'https://www.itagui.gov.co',
    tags: ['eventos', 'ferias', 'conciertos', 'congresos'],
  },
  {
    name: 'Iglesia Nuestra Señora del Rosario',
    category: 'Cultura',
    zone: 'Comuna 1',
    description:
      'Templo parroquial que preside el parque principal y una de las siluetas más reconocibles de Itagüí. Su arquitectura de estilo neocolonial y sus vitrales la convierten en parada obligada del recorrido por el centro tradicional del municipio.',
    images: [`${IMG}/b/b3/Itag%C3%BC%C3%AD_iglesia.jpg`],
    rating: 4.7,
    address: 'Calle 51 # 51-30, Centro, Itagüí',
    lat: 6.1723,
    lng: -75.6117,
    hours: 'Lunes a sábado, 6:00 a.m. - 7:00 p.m. · Domingos, 6:00 a.m. - 1:00 p.m.',
    tags: ['patrimonio', 'arquitectura', 'religioso', 'centro'],
  },
  {
    name: 'Parque de las Chimeneas',
    category: 'Parque',
    zone: 'Comuna 1',
    description:
      'Espacio público que conserva las chimeneas de ladrillo de las antiguas fábricas textiles, memoria viva del pasado industrial que le dio a Itagüí el nombre de "Ciudad Industrial de Colombia". Hoy combina zonas verdes, plazoletas y arte urbano.',
    images: [
      `${IMG}/thumb/e/eb/Itag%C3%BC%C3%AD_-_Parque_de_las_Chimeneas.jpg/1280px-Itag%C3%BC%C3%AD_-_Parque_de_las_Chimeneas.jpg`,
    ],
    rating: 4.4,
    address: 'Carrera 50A con Calle 47, Itagüí',
    lat: 6.169,
    lng: -75.6065,
    hours: 'Abierto todos los días, 24 horas',
    tags: ['patrimonio industrial', 'arte urbano', 'zonas verdes', 'acceso libre'],
  },
  {
    name: 'Antigua Estación del Ferrocarril de Itagüí',
    category: 'Museo',
    zone: 'Comuna 2',
    description:
      'Estación del Ferrocarril de Antioquia en el barrio Yarumito, declarada bien de interés cultural. Su edificación restaurada narra la época en que el tren articulaba la economía del Valle de Aburrá y hoy funciona como espacio cultural y de memoria.',
    images: [
      `${IMG}/thumb/a/ad/Vista_frontal_de_la_Estaci%C3%B3n_del_Ferrocarril_Itag%C3%BC%C3%AD._Barrio_Yarumito._Itag%C3%BC%C3%AD_%28Antioquia%29._Colombia.JPG/1280px-Vista_frontal_de_la_Estaci%C3%B3n_del_Ferrocarril_Itag%C3%BC%C3%AD._Barrio_Yarumito._Itag%C3%BC%C3%AD_%28Antioquia%29._Colombia.JPG`,
      `${IMG}/thumb/b/ba/Vistapanor%C3%A1mica_de_la_Estaci%C3%B3n_del_Ferrocarril_Itag%C3%BC%C3%AD._Barrio_Yarumito._Itag%C3%BC%C3%AD_%28Antioquia%29._Colombia.JPG/1280px-Vistapanor%C3%A1mica_de_la_Estaci%C3%B3n_del_Ferrocarril_Itag%C3%BC%C3%AD._Barrio_Yarumito._Itag%C3%BC%C3%AD_%28Antioquia%29._Colombia.JPG`,
      `${IMG}/thumb/f/fa/Vista_diagonal_de_la_Estaci%C3%B3n_del_Ferrocarril_Itag%C3%BC%C3%AD._Barrio_Yarumito._Itag%C3%BC%C3%AD_%28Antioquia%29._Colombia.JPG/1280px-Vista_diagonal_de_la_Estaci%C3%B3n_del_Ferrocarril_Itag%C3%BC%C3%AD._Barrio_Yarumito._Itag%C3%BC%C3%AD_%28Antioquia%29._Colombia.JPG`,
    ],
    rating: 4.5,
    address: 'Barrio Yarumito, Itagüí',
    lat: 6.1795,
    lng: -75.618,
    hours: 'Martes a sábado, 9:00 a.m. - 5:00 p.m.',
    tags: ['patrimonio', 'historia', 'ferrocarril', 'bien de interés cultural'],
  },
  {
    name: 'Centro Administrativo Municipal de Itagüí (CAMI)',
    category: 'Cultura',
    zone: 'Comuna 1',
    description:
      'Sede de la Alcaldía de Itagüí y referente de la arquitectura contemporánea del municipio. Su plazoleta de acceso es escenario de actos cívicos y exposiciones, y allí se atienden los trámites y la oferta institucional de turismo y cultura.',
    images: [
      `${IMG}/f/f8/Centro_Administrativo_de_Itag%C3%BC%C3%AD_CAMI.jpg`,
      `${IMG}/thumb/8/81/CAMI-Itagui.JPG/1280px-CAMI-Itagui.JPG`,
    ],
    rating: 4.3,
    address: 'Calle 51 # 51-55, Centro, Itagüí',
    lat: 6.1737,
    lng: -75.6104,
    hours: 'Lunes a viernes, 7:30 a.m. - 12:30 p.m. y 1:30 p.m. - 5:30 p.m.',
    website: 'https://www.itagui.gov.co',
    tags: ['institucional', 'arquitectura', 'trámites', 'centro'],
  },
  {
    name: 'Plaza de Mercado de Itagüí',
    category: 'Comercio',
    zone: 'Comuna 1',
    description:
      'Mercado tradicional donde se concentran los productos frescos de la región: frutas, verduras, hierbas, quesos y los puestos de comida típica antioqueña. Es el mejor lugar para probar una arepa de maíz recién asada y conversar con los comerciantes de siempre.',
    images: [
      `${IMG}/c/c5/Allmhurach_itagui_ventas.jpg`,
      `${IMG}/thumb/3/38/Arepas_%28Itag%C3%BC%C3%AD%29.jpg/1280px-Arepas_%28Itag%C3%BC%C3%AD%29.jpg`,
    ],
    rating: 4.4,
    address: 'Carrera 51 con Calle 49, Centro, Itagüí',
    lat: 6.1708,
    lng: -75.6122,
    hours: 'Lunes a sábado, 5:00 a.m. - 5:00 p.m. · Domingos, 5:00 a.m. - 1:00 p.m.',
    tags: ['gastronomía típica', 'mercado', 'productos frescos', 'comercio local'],
  },
  {
    name: 'Central Mayorista de Antioquia',
    category: 'Comercio',
    zone: 'Comuna 4',
    description:
      'La central de abastos más grande del departamento y uno de los mayores centros de acopio del país, ubicada en jurisdicción de Itagüí. Miles de bodegas y locales mueven a diario frutas, verduras, granos y abarrotes para todo el Valle de Aburrá.',
    images: [`${IMG}/thumb/4/4f/Panor%C3%A1mica_Itag%C3%BBise%C3%B1a.jpg/1280px-Panor%C3%A1mica_Itag%C3%BBise%C3%B1a.jpg`],
    rating: 4.2,
    address: 'Carrera 48 # 32B Sur, Itagüí',
    lat: 6.162,
    lng: -75.622,
    hours: 'Lunes a sábado, 4:00 a.m. - 6:00 p.m.',
    tags: ['abastos', 'comercio mayorista', 'economía', 'bodegas'],
  },
  {
    name: 'Alto de Manzanillo',
    category: 'Parque',
    zone: 'Corregimiento El Manzanillo',
    description:
      'Mirador natural en la zona rural de Itagüí, con senderos entre bosque nativo y vistas panorámicas de todo el Valle de Aburrá. Es el destino preferido para caminatas ecológicas, ciclomontañismo y avistamiento de aves al amanecer.',
    images: [`${IMG}/thumb/b/be/Panoramica_Itag%C3%BC%C3%AD.jpg/1280px-Panoramica_Itag%C3%BC%C3%AD.jpg`],
    rating: 4.7,
    address: 'Corregimiento El Manzanillo, zona rural de Itagüí',
    lat: 6.156,
    lng: -75.647,
    hours: 'Abierto todos los días, 6:00 a.m. - 5:00 p.m.',
    tags: ['naturaleza', 'mirador', 'senderismo', 'aves', 'ciclomontañismo'],
  },
];

// ─── Anuncios (carrusel de inicio) ──────────────────────────
const ANNOUNCEMENTS = [
  {
    title: 'Fiestas de la Industria, el Comercio y la Cultura',
    date: 'Del 18 al 27 de septiembre',
    zone: 'Comuna 1',
    image: `${IMG}/9/9e/Las_Fiestas_de_la_Industria_el_Comercio_y_la_Cultura_%28Itag%C3%BC%C3%AD%29.jpg`,
    cta: 'Ver programación',
  },
  {
    title: 'Domingos de ciclovía y recreación en Parque Ditaires',
    date: 'Todos los domingos, 8:00 a.m. - 12:00 m.',
    zone: 'Comuna 3',
    image: `${IMG}/thumb/3/37/Parque_Ditaires.jpg/1280px-Parque_Ditaires.jpg`,
    cta: 'Cómo llegar',
  },
  {
    title: 'Ruta patrimonial: chimeneas y estación del ferrocarril',
    date: 'Sábados, 9:00 a.m. · Inscripción gratuita',
    zone: 'Comuna 2',
    image: `${IMG}/thumb/e/eb/Itag%C3%BC%C3%AD_-_Parque_de_las_Chimeneas.jpg/1280px-Itag%C3%BC%C3%AD_-_Parque_de_las_Chimeneas.jpg`,
    cta: 'Reservar cupo',
  },
];

// ─── Eventos del calendario ─────────────────────────────────
const EVENTS = [
  {
    title: 'Mercado campesino y muestra artesanal',
    date: enDias(3),
    start_time: '08:00',
    end_time: '14:00',
    location: 'Parque Principal Simón Bolívar',
    description:
      'Productores del corregimiento El Manzanillo y artesanos locales ofrecen sus productos en el atrio del parque principal. Entrada libre.',
  },
  {
    title: 'Caminata ecológica al Alto de Manzanillo',
    date: enDias(6),
    start_time: '06:30',
    end_time: '11:00',
    location: 'Corregimiento El Manzanillo',
    description:
      'Recorrido guiado de dificultad media por senderos de bosque nativo, con avistamiento de aves. Se recomienda llevar agua, protector solar y calzado adecuado.',
  },
  {
    title: 'Retreta de la Banda Sinfónica de Itagüí',
    date: enDias(10),
    start_time: '17:00',
    end_time: '19:00',
    location: 'Parque Principal Simón Bolívar',
    description:
      'Concierto al aire libre con repertorio de música colombiana y bandas sonoras. Actividad gratuita para toda la familia.',
  },
  {
    title: 'Torneo interbarrios de fútbol',
    date: enDias(13),
    start_time: '09:00',
    end_time: '17:00',
    location: 'Parque Ditaires',
    description:
      'Fase final del torneo interbarrios en las canchas del complejo Ditaires, con la participación de equipos de las seis comunas.',
  },
  {
    title: 'Feria empresarial del sur del Valle de Aburrá',
    date: enDias(20),
    start_time: '10:00',
    end_time: '20:00',
    location: 'Centro de Convenciones y Exposiciones Ditaires',
    description:
      'Encuentro de industria, comercio y emprendimiento con más de cien expositores, ruedas de negocios y charlas especializadas.',
  },
  {
    title: 'Noche de museos: Estación del Ferrocarril',
    date: enDias(27),
    start_time: '18:00',
    end_time: '22:00',
    location: 'Antigua Estación del Ferrocarril de Itagüí',
    description:
      'Apertura nocturna de la estación con recorridos guiados sobre la historia del Ferrocarril de Antioquia, proyecciones y música en vivo.',
  },
];

// ─── Utilidades de inserción idempotente ────────────────────

/** Inserta o actualiza un sitio identificándolo por su nombre. */
async function upsertSite(s) {
  const existing = await query('SELECT id FROM sites WHERE name = ? LIMIT 1', [s.name]);
  const valores = [
    s.category,
    s.zone,
    s.description,
    JSON.stringify(s.images || []),
    s.rating ?? 5.0,
    s.address,
    s.lat,
    s.lng,
    s.hours || '',
    s.phone || '',
    s.instagram || '',
    s.facebook || '',
    s.website || '',
    JSON.stringify(s.tags || []),
  ];

  if (existing[0]) {
    await query(
      `UPDATE sites SET category = ?, zone = ?, description = ?, images = ?, rating = ?,
        address = ?, lat = ?, lng = ?, hours = ?, phone = ?, instagram = ?, facebook = ?,
        website = ?, tags = ? WHERE id = ?`,
      [...valores, existing[0].id]
    );
    return { accion: 'actualizado', id: existing[0].id };
  }

  const res = await query(
    `INSERT INTO sites
      (name, category, zone, description, images, rating, address, lat, lng, hours, phone, instagram, facebook, website, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [s.name, ...valores]
  );
  return { accion: 'creado', id: res.insertId };
}

/** Inserta un anuncio solo si no existe otro con el mismo título. */
async function upsertAnnouncement(a) {
  const existing = await query('SELECT id FROM announcements WHERE title = ? LIMIT 1', [a.title]);
  if (existing[0]) {
    await query('UPDATE announcements SET date = ?, zone = ?, image = ?, cta = ? WHERE id = ?', [
      a.date, a.zone, a.image, a.cta, existing[0].id,
    ]);
    return 'actualizado';
  }
  await query('INSERT INTO announcements (title, date, zone, image, cta) VALUES (?, ?, ?, ?, ?)', [
    a.title, a.date, a.zone, a.image, a.cta,
  ]);
  return 'creado';
}

/** Inserta un evento solo si no existe otro con el mismo título. */
async function upsertEvent(e) {
  const existing = await query('SELECT id FROM events WHERE title = ? LIMIT 1', [e.title]);
  if (existing[0]) {
    await query(
      'UPDATE events SET date = ?, start_time = ?, end_time = ?, location = ?, description = ? WHERE id = ?',
      [e.date, e.start_time, e.end_time, e.location, e.description, existing[0].id]
    );
    return 'actualizado';
  }
  await query(
    `INSERT INTO events (title, date, start_time, end_time, location, description, source)
     VALUES (?, ?, ?, ?, ?, ?, 'manual')`,
    [e.title, e.date, e.start_time, e.end_time, e.location, e.description]
  );
  return 'creado';
}

/** Elimina únicamente las filas creadas por esta semilla (modo --reset). */
async function resetSeed() {
  for (const s of SITES) {
    const rows = await query('SELECT id FROM sites WHERE name = ?', [s.name]);
    for (const r of rows) {
      await query('DELETE FROM visit_log WHERE site_id = ?', [r.id]);
      await query('DELETE FROM sites WHERE id = ?', [r.id]);
    }
  }
  for (const a of ANNOUNCEMENTS) {
    await query('DELETE FROM announcements WHERE title = ?', [a.title]);
  }
  for (const e of EVENTS) {
    await query('DELETE FROM events WHERE title = ?', [e.title]);
  }
  console.log('[seed] Semillas anteriores eliminadas (--reset).');
}

async function main() {
  const reset = process.argv.includes('--reset');

  await initDb();
  console.log('[seed] Base de datos lista.');

  if (reset) await resetSeed();

  let creados = 0;
  let actualizados = 0;

  for (const s of SITES) {
    const { accion } = await upsertSite(s);
    accion === 'creado' ? creados++ : actualizados++;
    console.log(`[seed] Sitio ${accion}: ${s.name}`);
  }

  for (const a of ANNOUNCEMENTS) {
    console.log(`[seed] Anuncio ${await upsertAnnouncement(a)}: ${a.title}`);
  }

  for (const e of EVENTS) {
    console.log(`[seed] Evento ${await upsertEvent(e)}: ${e.title} (${e.date})`);
  }

  const [{ total: totalSitios }] = await query('SELECT COUNT(*) AS total FROM sites');
  const [{ total: totalAnuncios }] = await query('SELECT COUNT(*) AS total FROM announcements');
  const [{ total: totalEventos }] = await query('SELECT COUNT(*) AS total FROM events');

  console.log('\n[seed] Resumen ─────────────────────────────');
  console.log(`[seed] Sitios: ${creados} creados, ${actualizados} actualizados (total en BD: ${totalSitios})`);
  console.log(`[seed] Anuncios en BD: ${totalAnuncios}`);
  console.log(`[seed] Eventos en BD: ${totalEventos}`);
  console.log('[seed] Listo.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[seed] Error:', err.message);
    process.exit(1);
  });
