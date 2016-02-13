/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */


(function (self) {
  'use strict';

  // On install, cache resources and skip waiting so the worker won't
  // wait for clients to be closed before becoming active.
  self.addEventListener('install', function (event) {
    event.waitUntil(oghliner.cacheResources().then(function () {
      return self.skipWaiting();
    }));
  });

  // On activation, delete old caches and start controlling the clients
  // without waiting for them to reload.
  self.addEventListener('activate', function (event) {
    event.waitUntil(oghliner.clearOtherCaches().then(function () {
      return self.clients.claim();
    }));
  });

  // Retrieves the request following oghliner strategy.
  self.addEventListener('fetch', function (event) {
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
      return this.CACHE_PREFIX + '075897521eb2fa76054b24506fadbe44543a0e47';
    },

    // This is a list of resources that will be cached.
    RESOURCES: [
      './', // cache always the current root to make the default page available
      './cards.html', // 8e4908310d6425390328a74fe6227068d4fc734e
      './index.html', // 202b51eaeb8d512374b859869a3c1527cd6036f6
      './laptop.html', // c07478b56b53661931a6ed27cdfa60645c767a59
      './org-arpeggio.mp3', // 16abd9941059a90e2da68d83172da6ccbd70a8bf
      './org-chordrhythm.mp3', // 1fed825a05c4414a0ce95e8723950ee8ede72aaa
      './org-highmelodic.mp3', // 290d3bada7db423f9be3db827452394422e383d7
      './org-lowmelodic.mp3', // 57628d0d10229d1d522bf11187f75c4dda4e6687
      './org-mel1.mp3', // 8956d893553aa2b423476faff5b017370687cdf1
      './org-perc.mp3', // 8f1b28517550aa8fbc0af8b581fb835945468b6b
      './org-shout.mp3', // 507878565736441fcfea20384a3361deb629293e
      './org-stabs.mp3', // 6ba7326cd6fda71048234d7265da13f6fa53e085
      './org-sust1.mp3', // 3c7f1e8dd3fdaa33d4132797dda3a469fbd6ef6b
      './saw440.mp3', // d0622a2fa3c5aac241c53a7eb9bbbecadce7a640
      './sqr440.mp3', // af66b6594f894fad0503bb1b0bfe5f3993c64111
      './Vla1-HarmonicsX.mp3', // f62d6abc99dbdde9827b43c692a332f90578c2d7
      './Vla2-GlissX.mp3', // d3eff825f7344e34c2fc89e78b0361498202d71b
      './Vla3-Melody1X.mp3', // 90b4427137881e01375a61dce899a60c490fcca9
      './Vla4-Melody2X.mp3', // c2220f71a778e62e1230d7330cebc230d55c8338
      './Vla5-PizzX.mp3', // 8474f28e388585430cbda06daf06c00825ecfc9a
      './Vla6-ArpX.mp3', // 80679732d7e15fe623352600e4033ef3e03dfc53
      './Vla7-WoodKnockX.mp3', // 64931c5358fc468d2849290e815333c23e13be1a
      './Vla8-Trill-SnapX.mp3', // 3c2baa572349c5d9eb383d9474e507234fc3c798
      './chorister.png', // 8165e80d894c7a8797da1480240d2cb3ce96117c
      './w3c-manifest.json', // ad464e342585e3d52ff2d973486c5310371a9f99
      './css/app.css', // 55dfa1c56a3649e727502aceb6d0ef2fdce1bca6
      './css/bootstrap.css', // cb0bed917662657e1dcc0ab7ec37deb042301441
      './fonts/glyphicons-halflings-regular.eot', // d53dff38dfb5c414015dfb31d30a473c95b50904
      './fonts/glyphicons-halflings-regular.svg', // 796e58aedfcfe8a3b0829bc0594f739936a9d7d0
      './fonts/glyphicons-halflings-regular.ttf', // c427041d38cd6597ae7e758028ab72756849ec26
      './fonts/glyphicons-halflings-regular.woff', // c707207e52ffe555a36880e9873d146c226e3533
      './js/app.js', // ee88b742c928db9b6a97fc46540815b59c40f78b
      './js/birdSongPlayer.js', // 0905a106cb3e04472067a08d353ccd5d6d51bb94
      './js/bootstrap.js', // 8c639912ccd43078865578e598607d1b847c2373
      './js/jquery.min.js', // ae49e56999d82802727455f0ba83b63acd90a22b
      './js/offline-manager.js', // 66eee9a121acf84e027e87bc73264faaa900ca8b
      './js/placeTimeBirdSongs.js', // d8074835d26825c23b719010cd63e709755df789

    ],

    // Adds the resources to the cache controlled by this worker.
    cacheResources: function () {
      var now = Date.now();
      var baseUrl = self.location;
      return this.prepareCache()
      .then(function (cache) {
        return Promise.all(this.RESOURCES.map(function (resource) {
          // Bust the request to get a fresh response
          var url = new URL(resource, baseUrl);
          var bustParameter = (url.search ? '&' : '') + '__bust=' + now;
          var bustedUrl = new URL(url.toString());
          bustedUrl.search += bustParameter;

          // But cache the response for the original request
          var requestConfig = { credentials: 'same-origin' };
          var originalRequest = new Request(url.toString(), requestConfig);
          var bustedRequest = new Request(bustedUrl.toString(), requestConfig);
          return fetch(bustedRequest).then(function (response) {
            if (response.ok) {
              return cache.put(originalRequest, response);
            }
            console.error('Error fetching ' + url + ', status was ' + response.status);
          });
        }));
      }.bind(this));
    },

    // Remove the offline caches not controlled by this worker.
    clearOtherCaches: function () {
      var deleteIfNotCurrent = function (cacheName) {
        if (cacheName.indexOf(this.CACHE_PREFIX) !== 0 || cacheName === this.CACHE_NAME) {
          return Promise.resolve();
        }
        return self.caches.delete(cacheName);
      }.bind(this);

      return self.caches.keys()
      .then(function (cacheNames) {
        return Promise.all(cacheNames.map(deleteIfNotCurrent));
      });

    },

    // Get a response from the current offline cache or from the network.
    get: function (request) {
      return this.openCache()
      .then(function (cache) {
        return cache.match(request);
      })
      .then(function (response) {
        if (response) {
          return response;
        }
        return self.fetch(request);
      });
    },

    // Prepare the cache for installation, deleting it before if it already exists.
    prepareCache: function () {
      return self.caches.delete(this.CACHE_NAME).then(this.openCache.bind(this));
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
