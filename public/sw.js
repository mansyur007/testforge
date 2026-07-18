// F-36 Part B: hand-rolled service worker (no workbox/next-pwa). Deliberately
// minimal — an SW bug can brick every client until its cache version rotates,
// so this does exactly three things and passes everything else through:
//
//   1. install  → precache the /offline fallback page, then skipWaiting()
//   2. navigate → network-first, falling back to cached /offline when offline
//   3. /_next/static/ (content-hashed, immutable) → cache-first
//
// Every /api/ request and server-action POST passes through UNTOUCHED — a stale
// run list is worse than an offline page, and the offline result queue (Part C)
// owns retry, not the SW cache.
//
// Bump V on any change to this file so `activate` drops the old cache.
const V = "tf-sw-1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(V)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== V).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // never touch POST/PUT/etc.

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // third-party: browser default

  // Navigations: network-first, offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Immutable build assets: cache-first (fill the cache on first hit).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(V).then((cache) => cache.put(request, copy));
            return res;
          })
      )
    );
    return;
  }

  // Everything else (including /api/): straight to the network, no caching.
});
