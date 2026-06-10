/* Service worker — deja toda la app disponible sin internet.
   Al publicar una versión nueva, cambiar VERSION para que
   los celulares de la congregación se actualicen solos. */
const VERSION = 'himnario-v3';
const ARCHIVOS = [
  './', 'index.html', 'css/estilos.css', 'js/app.js',
  'datos/himnos.js', 'datos/temas.js', 'datos/boletines.js',
  'manifest.webmanifest',
  'fuentes/playfair-display-latin-700-normal.woff2',
  'fuentes/playfair-display-latin-900-normal.woff2',
  'fuentes/crimson-pro-latin-400-normal.woff2',
  'fuentes/crimson-pro-latin-400-italic.woff2',
  'fuentes/crimson-pro-latin-600-normal.woff2',
  'iconos/icono-192.png', 'iconos/icono-512.png'
];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Estrategia: red primero con respaldo en caché (así las actualizaciones llegan,
// pero sin internet todo sigue funcionando).
self.addEventListener('fetch', ev => {
  if (ev.request.method !== 'GET') return;
  ev.respondWith(
    fetch(ev.request)
      .then(resp => {
        const copia = resp.clone();
        caches.open(VERSION).then(c => c.put(ev.request, copia));
        return resp;
      })
      .catch(() => caches.match(ev.request, { ignoreSearch: true })
        .then(r => r || caches.match('index.html')))
  );
});
