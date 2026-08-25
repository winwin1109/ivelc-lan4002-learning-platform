const CACHE_NAME = 'lan4002-pwa-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // 如果你有確保會用到的圖片，也可以加在這裡，例如 './P1.jpg'
];

// 1. 安裝 Service Worker 並快取基本檔案
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. 攔截網路請求，實現離線讀取 (Cache First 策略)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果在快取中找到對應檔案，直接回傳快取檔案
        if (response) {
          return response;
        }
        // 否則透過網路去抓取
        return fetch(event.request);
      })
  );
});

// 3. 更新 Service Worker 時，清除舊的快取
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});