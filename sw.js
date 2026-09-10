// 更新快取版本號，這樣瀏覽器才會知道有新內容並清除舊快取
const CACHE_NAME = 'lan4002-pwa-v2'; 

// 預先快取的檔案清單 (已加入新增的 lt4-tq5.jpg 和 lt5-tq3.jpg)
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    
    // 封面與各課封面圖
    './P1.jpg', './P2.jpg', './P3.jpg', './P4.jpg', './P5.jpg', 
    './P6.jpg', './P7.jpg', './P8.jpg', './P9.jpg', './P10.jpg', './P11.jpg',
    
    // 第一課 QR Code
    './lt1-tq1.jpg', './lt1-tq2.jpg', './lt1-tq3.jpg',
    
    // 第二課 QR Code
    './lt2-tq1.jpg', './lt2-tq2.jpg', './lt2-tq3.jpg', './lt2-tq4.jpg', './lt2-tq5.jpg',
    
    // 第三課 QR Code
    './lt3-tq1.jpg', './lt3-tq2.jpg', './lt3-tq3.jpg',
    
    // 第四課 QR Code (包含新增的 lt4-tq5)
    './lt4-tq1.jpg', './lt4-tq2.jpg', './lt4-tq3.jpg', './lt4-tq4.jpg', './lt4-tq5.jpg',
    
    // 第五課 QR Code (包含新增的 lt5-tq3)
    './lt5-tq1.jpg', './lt5-tq2.jpg', './lt5-tq3.jpg',
    
    // 第六課 QR Code
    './lt6-tq1.jpg', './lt6-tq2.jpg', './lt6-tq3.jpg'
];

// 安裝階段：將指定的檔案加入快取
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] 快取已開啟，正在存入檔案...');
                // 使用 addAll 會嘗試下載清單中所有檔案
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting()) // 強制新的 SW 立即生效
    );
});

// 啟動階段：清除舊版本的快取
self.addEventListener('activate', event => {
    const cacheAllowlist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // 如果快取名稱不在白名單內 (即舊版本)，則刪除之
                    if (cacheAllowlist.indexOf(cacheName) === -1) {
                        console.log('[Service Worker] 刪除舊快取:', cacheName);
                        return caches.delete(cacheName); 
                    }
                })
            );
        }).then(() => self.clients.claim()) // 立即接管所有受控的頁面
    );
});

// 攔截請求：採用 Cache First, fall back to Network 的策略
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果在快取中找到檔案，就直接回傳快取的版本，加快載入速度
                if (response) {
                    return response;
                }
                
                // 否則透過網路抓取
                return fetch(event.request).then(
                    function(networkResponse) {
                        // 確保獲得有效回應才進行動態快取
                        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // 將新抓取到的檔案複製一份存入快取中，方便下次離線使用
                        var responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    }
                );
            })
    );
});