var cacheName = 'DartsForge-cache';
self.addEventListener('install', e => {
    self.skipWaiting(); 
    e.waitUntil(
        caches.open(cacheName).then(cache => {
            var root = "/DartsForge/";
            return cache.addAll([
              root + '',
              root + 'index.html',
              root + 'android-chrome-192x192.png',
              root + 'android-chrome-512x512.png',
              root + 'apple-touch-icon.png',
              root + 'browserconfig.xml',
              root + 'endings.js',
              root + 'favicon-16x16.png',
              root + 'favicon-32x32.png',
              root + 'favicon.ico',
              root + 'icon.png',
              root + 'indexedDB.js',
              root + 'language.js',
              root + 'media.css',
              root + 'menu.css',
              root + 'mstile-150x150.png',
              root + 'safari-pinned-tab.svg',
              root + 'settings.js',
              root + 'site.webmanifest',
              root + 'styles.css',
              root + 'sw.js',
              root + 'swipe.js',
              root + 'vue.min.js',
              root + 'vueComponents.js',
            ]);
        })
    );
});

self.addEventListener('fetch', function(event) {
  console.log(event.request.url);
  event.respondWith(fromNetwork(event.request, 400).catch(function () {
    return fromCache(event.request);
  }));
});
function fromCache(request) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request).then(function (matching) {
      if(matching)
        return matching;
      return fetch(request).then(function (response) {
        cache.put(request, response.clone()).then(function() {
          return response;
        });
      });
    });
  });
}
function fromNetwork(request, timeout) {
  return new Promise(function (fulfill, reject) {
    var timeoutId = setTimeout(reject, timeout);
    fetch(request).then(function (response) {
      clearTimeout(timeoutId);
      caches.open(cacheName).then(function (cache) {
        cache.put(request, response.clone()).then(function() {
          fulfill(response);
        });
      });
    }, reject);
  });
}
function update(request) {
  return caches.open(cacheName).then(function (cache) {
    return fetch(request).then(function (response) {
      return cache.put(request, response);
    });
  });
}