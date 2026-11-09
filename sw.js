// Painboard service worker
// - 페이지(HTML): 네트워크 우선, 오프라인이면 마지막으로 받은 페이지를 보여줌
// - 아이콘/manifest: 캐시 우선
// - Supabase, 구글 애널리틱스 등 다른 도메인 요청과 GET 이외 요청은 건드리지 않음
const VERSION = 'pb-v1';
const PRECACHE = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('/', copy)); }
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  if (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.webmanifest') {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
