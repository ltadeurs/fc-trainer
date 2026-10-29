// Gegenereerd door scripts/sw.mjs
const CACHE = 'fc-trainer-96b339831acd'
const FILES = ["./","./assets/bodypaths-sah8O05u.js","./assets/exo2-3KOvIEvE.woff2","./assets/index-CQ3k4lyK.js","./assets/index-CuumFey1.css","./assets/motions-XmZX7H6I.js","./assets/sql-wasm-browser-Bu6DMMRk.js","./assets/sql-wasm-browser-C1D_RJuy.wasm","./assets/sql-wasm-browser-DyJLP_E5.js","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon.svg","./manifest.webmanifest"]

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    // Altijd vers van de server (niet uit de HTTP-cache): GitHub Pages laat bestanden 10 minuten bewaren,
    // en een oude index.html in deze cache verwijst naar bestanden die niet meer bestaan (wit scherm).
    const responses = await Promise.all(FILES.map(async (url) => {
      const res = await fetch(new Request(url, { cache: 'reload' }))
      if (!res.ok) throw new Error(url + ': ' + res.status)
      return [url, res]
    }))
    // De pagina moet naar de bestanden van deze versie verwijzen. Zo niet (oude kopie van de CDN), dan
    // mislukt de installatie; de huidige versie blijft werken en de update wordt later opnieuw geprobeerd.
    const html = await responses[0][1].clone().text()
    const refs = html.split('"').filter((p) => p.startsWith('./assets/') || p.startsWith('assets/'))
    for (const ref of refs) {
      if (!FILES.includes(ref.startsWith('./') ? ref : './' + ref)) throw new Error('index.html hoort bij een andere versie')
    }
    const cache = await caches.open(CACHE)
    await Promise.all(responses.map(([url, res]) => cache.put(url, res)))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('fc-trainer-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

// Eerst uit de cache (offline), anders van het netwerk. Navigaties krijgen altijd de app-pagina.
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./', { ignoreVary: true }).then((r) => r || fetch(req)))
    return
  }
  e.respondWith(caches.match(req, { ignoreSearch: true, ignoreVary: true }).then((r) => r || fetch(req)))
})

// Melding van de push-API (rust voorbij). Safari eist dat elke push een zichtbare melding geeft.
self.addEventListener('push', (e) => {
  let data = {}
  try {
    data = e.data ? e.data.json() : {}
  } catch {
    // geen of onleesbare inhoud: standaardtekst
  }
  e.waitUntil(self.registration.showNotification(data.title || 'Rust voorbij', {
    body: data.body || 'Tijd voor je volgende set 💪',
    tag: 'rest',
    renotify: true,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
  }))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((list) => (list[0] ? list[0].focus() : self.clients.openWindow('./'))),
  )
})
