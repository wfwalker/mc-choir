/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */


(function (self) {
  'use strict';

  // On install, cache resources and skip waiting so the worker won't
  // wait for clients to be closed before becoming active.
  self.addEventListener('install', event =>
    event.waitUntil(
      oghliner.cacheResources()
      .then(() => self.skipWaiting())
    )
  );

  // On activation, delete old caches and start controlling the clients
  // without waiting for them to reload.
  self.addEventListener('activate', event =>
    event.waitUntil(
      oghliner.clearOtherCaches()
      .then(() => self.clients.claim())
    )
  );

  // Retrieves the request following oghliner strategy.
  self.addEventListener('fetch', event => {
    if (event.request.method === 'GET') {
      event.respondWith(oghliner.get(event.request));
    } else {
      event.respondWith(self.fetch(event.request));
    }
  });

  var oghliner = self.oghliner = {

    // This is the unique prefix for all the caches controlled by this worker.
    CACHE_PREFIX: 'offline-cache:wfwalker/mc-choir:' + (self.registration ? self.registration.scope : '') + ':',

    // This is the unique name for the cache controlled by this version of the worker.
    get CACHE_NAME() {
      return this.CACHE_PREFIX + '6a192b153502494db44e2a4f47d7c107505ab3b5';
    },

    // This is a list of resources that will be cached.
    RESOURCES: [
      './cards.html', // 8e4908310d6425390328a74fe6227068d4fc734e
      './index.html', // 54ef446fb92d4d64b3791af2502b5ef890ece657
      './laptop.html', // 985381b091d86bb60d91ac27442f9488de82684a
      './audio/org-arpeggio.mp3', // 39d626c2840f05ab2e9623c63f7ede76f64b2b53
      './audio/org-chordrhythm.mp3', // 51eed667e9728d686d3537649d203ba2a1218d8c
      './audio/org-highmelodic.mp3', // 2cd9442da4eef2bea3dcad83c95b757e23a970dd
      './audio/org-lowmelodic.mp3', // 6c4a6ec1b24ea5c54cc28d374ac0ee733b6e07d2
      './audio/org-mel1.mp3', // 8956d893553aa2b423476faff5b017370687cdf1
      './audio/org-perc.mp3', // fd1e125abccc25a70b6046082bc099483ac56a64
      './audio/org-shout.mp3', // 893b158c19c8411308075d246e18a1d0df45880f
      './audio/org-stabs.mp3', // 23e47b0beb910057854e0bcb6c8fc16e0c090b70
      './audio/org-sust1.mp3', // c5b2d47fbbb59bf80b7a9cc6a4ec60be745eb628
      './audio/saw440.mp3', // d0622a2fa3c5aac241c53a7eb9bbbecadce7a640
      './audio/sqr440.mp3', // af66b6594f894fad0503bb1b0bfe5f3993c64111
      './audio/Vla1-HarmonicsX.mp3', // f62d6abc99dbdde9827b43c692a332f90578c2d7
      './audio/Vla2-GlissX.mp3', // d3eff825f7344e34c2fc89e78b0361498202d71b
      './audio/Vla3-Melody1X.mp3', // 90b4427137881e01375a61dce899a60c490fcca9
      './audio/Vla4-Melody2X.mp3', // c2220f71a778e62e1230d7330cebc230d55c8338
      './audio/Vla5-PizzX.mp3', // 8474f28e388585430cbda06daf06c00825ecfc9a
      './audio/Vla6-ArpX.mp3', // 80679732d7e15fe623352600e4033ef3e03dfc53
      './audio/Vla7-WoodKnockX.mp3', // 64931c5358fc468d2849290e815333c23e13be1a
      './audio/Vla8-Trill-SnapX.mp3', // 3c2baa572349c5d9eb383d9474e507234fc3c798
      './img/chorister.png', // 8165e80d894c7a8797da1480240d2cb3ce96117c
      './img/org-arpeggio.png', // 7461db9b8d1ca4bc5a1a7f289556a54f5cffd902
      './img/org-chordrhythm.png', // ee4cbe1b8a1715f5b03c0121cdaec12366d4327b
      './img/org-highmelodic.png', // bbb70ff3cf31cfbc7b4272f509c969a06e87f00b
      './img/org-lowmelodic.png', // 678cca109bcd9db2816f538f98cccc2eb9890801
      './img/org-perc.png', // f41c4071928ca237e02aa1616b941bff92875c4b
      './img/org-shout.png', // 4d1e327862b027e267d031bbd2ca252c07d51822
      './img/org-stabs.png', // a721e8b3594a4258e68c6d78ab3e81104b12fdb8
      './img/org-sust1.png', // f5aae3eb2960a1cab68fd1d367ab2be941cee87a
      './img/Vla1-HarmonicsX.png', // 6b81523e20228b45df3c1dca5657fe1f49ce372a
      './img/Vla2-GlissX.png', // a2790ce790a1e3a3bbed755a1518ea658175728a
      './img/Vla3-Melody1X.png', // 85bf14e0255592e6406edcd421aeec1bfbfef380
      './img/Vla4-Melody2X.png', // 4eb1fc2c18ecbf34984565aa776b40967f4dd25d
      './img/Vla5-PizzX.png', // 0563077d5f940a2c41206c28b5458fc87ae778c5
      './img/Vla6-ArpX.png', // 97f0ef89fad7b7e0aaa1e6137249fc5138abd2f8
      './img/Vla7-WoodKnockX.png', // d885c332f86def824bad187072784536568b2ca5
      './img/Vla8-Trill-SnapX.png', // d6223e85bf8a00083667198bc372afcc797feefb
      './w3c-manifest.json', // 3b99a226a10c2408d649e1eb23ba98e4e0283b7f
      './css/app.css', // 10f3fb3fad9751ab1a672f850a7c067162c7dfa1
      './css/bootstrap.css', // 4316dcfb54e1b0a428e1d37203a4028fd0408298
      './fonts/glyphicons-halflings-regular.eot', // d53dff38dfb5c414015dfb31d30a473c95b50904
      './fonts/glyphicons-halflings-regular.svg', // 796e58aedfcfe8a3b0829bc0594f739936a9d7d0
      './fonts/glyphicons-halflings-regular.ttf', // c427041d38cd6597ae7e758028ab72756849ec26
      './fonts/glyphicons-halflings-regular.woff', // c707207e52ffe555a36880e9873d146c226e3533
      './js/app.js', // decf7963da2718040433f7ae29d354abd0065aa6
      './js/bootstrap.min.js', // 791aa054a026bddc0de92bad6cf7a1c6e73713d5
      './js/fastclick.js', // 06cef196733a710e77ad7e386ced6963f092dc55
      './js/jquery.min.js', // 3b0f35285a7088b1fd321773696f9d3b45d31942
      './js/offline-manager.js', // d05c1a0c906b58a4da5f084b90c79ebecd6435ae

    ],

    // Adds the resources to the cache controlled by this worker.
    cacheResources: function () {
      var now = Date.now();
      var baseUrl = self.location;
      return this.prepareCache()
      .then(cache => Promise.all(this.RESOURCES.map(resource => {
        // Bust the request to get a fresh response
        var url = new URL(resource, baseUrl);
        var bustParameter = (url.search ? '&' : '') + '__bust=' + now;
        var bustedUrl = new URL(url.toString());
        bustedUrl.search += bustParameter;

        // But cache the response for the original request
        var requestConfig = { credentials: 'same-origin' };
        var originalRequest = new Request(url.toString(), requestConfig);
        var bustedRequest = new Request(bustedUrl.toString(), requestConfig);
        return fetch(bustedRequest)
        .then(response => {
          if (response.ok) {
            return cache.put(originalRequest, response);
          }
          console.error('Error fetching ' + url + ', status was ' + response.status);
        });
      })));
    },

    // Remove the offline caches not controlled by this worker.
    clearOtherCaches: function () {
      var outOfDate = cacheName => cacheName.startsWith(this.CACHE_PREFIX) && cacheName !== this.CACHE_NAME;

      return self.caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
        .filter(outOfDate)
        .map(cacheName => self.caches.delete(cacheName))
      ));
    },

    // Get a response from the current offline cache or from the network.
    get: function (request) {
      return this.openCache()
      .then(cache => cache.match(() => this.extendToIndex(request)))
      .then(response => {
        if (response) {
          return response;
        }
        return self.fetch(request);
      });
    },

    // Make requests to directories become requests to index.html
    extendToIndex: function (request) {
      var url = new URL(request.url, self.location);
      var path = url.pathname;
      if (path[path.length - 1] !== '/') {
        return request;
      }
      url.pathname += 'index.html';
      return new Request(url.toString(), request);
    },

    // Prepare the cache for installation, deleting it before if it already exists.
    prepareCache: function () {
      return self.caches.delete(this.CACHE_NAME)
      .then(() => this.openCache());
    },

    // Open and cache the offline cache promise to improve the performance when
    // serving from the offline-cache.
    openCache: function () {
      if (!this._cache) {
        this._cache = self.caches.open(this.CACHE_NAME);
      }
      return this._cache;
    }

  };
}(self));
