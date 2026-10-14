/**
 * Crystal Beauty — Admin Service Worker
 * Namespace: crystal_beauty
 * Strictly enforces NetworkOnly for all admin, API, and auth routes.
 */

const CACHE_NAME = "crystal_beauty_v1";

// Static assets to optionally cache for offline shell
const PRECACHE_ASSETS = [
  "/crystal-beauty-logo.jpg",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("Precache failed silently:", err);
      });
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Purge old caches not matching current version
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key.startsWith("crystal_beauty_") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      }),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // STRICT RULE: All API, auth, upload, and Admin requests are NetworkOnly.
  // Never serve stale cached orders or mutations.
  const isApi = url.pathname.startsWith("/api/");
  const isAdmin =
    url.pathname.startsWith("/admin") ||
    url.searchParams.has("admin");
  const isAuth = url.pathname.includes("login") || url.pathname.includes("logout");
  const isNonGet = event.request.method !== "GET";

  if (isApi || isAdmin || isAuth || isNonGet) {
    // Direct network pass-through — no caching whatsoever
    event.respondWith(fetch(event.request));
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache successful immutable static files (fonts, public images)
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.startsWith("/images/") ||
            url.pathname.endsWith(".jpg") ||
            url.pathname.endsWith(".webp") ||
            url.pathname.endsWith(".svg") ||
            url.pathname.endsWith(".woff2"))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

// Native push & local notification click navigation
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = "/admin/orders";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client && client.url.includes("/admin")) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
