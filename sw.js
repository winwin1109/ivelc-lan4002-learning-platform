// 1. 定義快取名稱與版本號 (每次更新 HTML 或圖片時，請更改此名稱，例如改成 v3, v4...)
const CACHE_NAME = 'lan4002-cache-v2';

// 2. 核心快取清單：首次載入時強制快取的檔案
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  // 加入您最新新增的兩張特訓區 QR Code
  './lt6-tq4.jpg',
  './lt6-tq5.jpg'
];

// --------------------------------------------------------
// 生命週期 1：安裝階段 (Install)
// --------------------------------------------------------
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] 快取核心資源中...');
        return cache.addAll(urlsToCache);
      })
  );
  // 強制立即接管控制權，不需要等待使用者關閉所有分頁
  self.skipWaiting();
});

// --------------------------------------------------------
// 生命週期 2：啟動與清除階段 (Activate)
// --------------------------------------------------------
self.addEventListener('activate', event => {
  const cacheAllowlist = [CACHE_NAME];
  
  event.waitUntil(
    // 檢查所有快取，如果不是最新版本 (CACHE_NAME)，就把它刪除
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] 刪除舊版快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 立即取得頁面控制權，確保新快取馬上生效
  self.clients.claim();
});

// --------------------------------------------------------
// 生命週期 3：攔截網路請求 (Fetch) - 動態快取策略
// --------------------------------------------------------
self.addEventListener('fetch', event => {
  // 僅攔截 GET 請求，忽略 POST 或擴充功能的特殊請求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 策略 A：如果快取裡有這個檔案，直接秒速回傳快取 (離線可用)
        if (response) {
          return response;
        }

        // 策略 B：如果快取沒有，則向網路發送請求 (Network Fallback)
        return fetch(event.request).then(networkResponse => {
          // 檢查是否為有效且同源的正常請求，否則直接回傳不快取
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // 複製一份網路回傳的檔案 (因為 Response Stream 只能被讀取一次)
          const responseToCache = networkResponse.clone();

          // 將新抓到的檔案動態存入最新快取中，下次就能離線讀取
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        }).catch(err => {
          // 當完全斷網且快取中找不到該檔案時的例外處理
          console.log('[Service Worker] 請求失敗，處於離線狀態:', event.request.url);
        });
      })
  );
});