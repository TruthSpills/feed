/* Hack Thai service worker
   - pictures: served instantly from the phone, refreshed quietly in the background
   - page + jobs: always fetched fresh, with the last copy kept for when signal drops */
const PAGES = 'ht-pages-v1';
const IMAGES = 'ht-img-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (![PAGES, IMAGES].includes(k)) await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.startsWith('/img/')) {
    e.respondWith((async () => {
      const cache = await caches.open(IMAGES);
      const hit = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req).then(res => { if (res.ok) cache.put(url.pathname, res.clone()); return res; }).catch(() => hit);
      return hit || fresh;
    })());
    return;
  }

  e.respondWith((async () => {
    const cache = await caches.open(PAGES);
    const key = url.pathname === '/' || url.pathname === '/index.html' ? '/' : url.pathname;
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(key, res.clone());
      return res;
    } catch (err) {
      return (await cache.match(key)) || (await cache.match('/')) || Response.error();
    }
  })());
});
