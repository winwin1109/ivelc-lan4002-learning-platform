const CACHE_NAME = 'lan4002-teacher-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// 安裝 Service Worker 並快取基本檔案
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// 攔截網路請求，若有快取則回傳快取，否則從網路抓取
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});