// Keeps the app working offline. Pages load from the network when it's available
// (so updates show up right away) and fall back to the saved copy when it isn't.
const CACHE = "habit-tracker-v2";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
  );
});

// Tapping a reminder opens (or focuses) the app; the evening check-in reminder opens the check-in.
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const checkin = !!e.notification.data?.checkin;
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then(list => {
      if (list.length) {
        if (checkin) list[0].postMessage({ type: "open-checkin" });
        return list[0].focus();
      }
      return self.clients.openWindow(checkin ? "./?checkin" : "./");
    })
  );
});
