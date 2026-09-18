/* Offline cache for the Excuse Generator static pages. App shell only;
 * nothing is ever sent anywhere — generation runs entirely in the browser. */
const CACHE = "excuse-generator-v1";
const ASSETS = [
  "./",
  "index.html",
  "ExcuseGenerator.html",
  "PowerGenerator.html",
  "ExcuseGeneratorTest.html",
  "ExcuseGenerator.js",
  "css/app.css",
  "manifest.webmanifest",
  "favicon.svg"
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (ev) => {
  if (ev.request.method !== "GET") return;
  ev.respondWith(
    caches.match(ev.request, { ignoreSearch: true }).then((hit) => hit || fetch(ev.request))
  );
});
