// This address used to serve the Nest web app; it now lives in /nest/app/.
// A browser that still runs the old offline worker for /nest/ gets this one
// instead: it removes itself and the old offline copy, then reloads the open
// pages, which then show the new site (or the app, for an installed copy).
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.includes('/nest/') && !k.includes('/nest/app/'))
          .map((k) => caches.delete(k)),
      );
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      for (const w of windows) {
        try {
          // Refresh the browser's own copy first, so the reload can't bring
          // back the old page (which would register this worker again).
          await fetch(w.url, { cache: 'reload', credentials: 'same-origin' });
        } catch (e) {
          // offline: reload anyway
        }
        w.navigate(w.url);
      }
    })(),
  );
});
