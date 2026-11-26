/* Hack Thai service worker
   - pictures: served instantly from the phone, refreshed quietly in the background
   - page + jobs: always fetched fresh, with the last copy kept for when signal drops */
const PAGES = 'ht-pages-v2';
const IMAGES = 'ht-img-v1';

const appShell = '/?app=free-funnel-v2';
const isAppPage = path => path === '/' || path === '/index.html';

async function fetchAppPage(cache) {
  const response = await fetch(appShell, { cache: 'no-cache' });
  if (!response.ok) throw new Error('Free guide unavailable');
  await cache.put('/', response.clone());
  return response;
}

self.addEventListener('install', event => event.waitUntil((async () => {
  await fetchAppPage(await caches.open(PAGES));
  await self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  const upgrading = await caches.has('ht-pages-v1');
  if (upgrading) await caches.delete('ht-pages-v1');
  await self.clients.claim();
  if (upgrading) {
    const windows = await self.clients.matchAll({ type: 'window' });
    await Promise.allSettled(windows.map(client => {
      const url = new URL(client.url);
      if (isAppPage(url.pathname) && ['', '#home'].includes(url.hash)) return client.navigate(client.url);
    }));
  }
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
      if (req.mode === 'navigate' && isAppPage(url.pathname)) return await fetchAppPage(cache);
      const res = await fetch(req);
      if (res.ok) cache.put(key, res.clone());
      return res;
    } catch (err) {
      return (await cache.match(key)) || (await cache.match('/')) || Response.error();
    }
  })());
});
