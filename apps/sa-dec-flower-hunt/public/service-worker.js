// Service Worker for Sa Dec Flower Hunt PWA
// Version: 1.0.1

const CACHE_NAME = 'sadec-v1.0.1';
const OFFLINE_URL = '/offline';

// Assets to cache immediately on install (only essentials that EXIST)
const PRECACHE_ASSETS = [
    '/',
    '/manifest.json',
];

// Install Event - Cache essential assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Precaching assets');
            // Cache assets individually to avoid failing on missing files
            return Promise.allSettled(
                PRECACHE_ASSETS.map(url =>
                    cache.add(url).catch(err => {
                        console.warn(`[ServiceWorker] Failed to cache ${url}:`, err);
                    })
                )
            );
        })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        })
    );
    // Take control of all clients immediately
    return self.clients.claim();
});

// Fetch Event - Network-first strategy with offline fallback
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip API calls from caching (always fetch fresh)
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone response to cache
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If no cache and it's a navigation request, show offline page
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }
                    // Return a generic offline response
                    return new Response('Offline - No cached version available', {
                        status: 503,
                        statusText: 'Service Unavailable',
                    });
                });
            })
    );
});

// Background Sync (Future enhancement)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-orders') {
        console.log('[ServiceWorker] Background sync: orders');
        // Future: Sync pending orders when connection restores
    }
});

// Push Notification (Future enhancement)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'Bạn có thông báo mới!',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            vibrate: [200, 100, 200],
            data: {
                url: data.url || '/',
            },
        };
        event.waitUntil(
            self.registration.showNotification(data.title || 'Flower Hunt', options)
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});
