/**
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// This generated service worker JavaScript will precache your site's resources.
// The code needs to be saved in a .js file at the top-level of your site, and registered
// from your pages in order to be used. See
// https://github.com/googlechrome/sw-precache/blob/master/demo/app/js/service-worker-registration.js
// for an example of how you can register this script and handle various service worker events.

/* eslint-env worker, serviceworker */
/* eslint-disable no-unused-vars, no-multiple-empty-lines, max-nested-callbacks, space-before-function-paren */
'use strict';



/* eslint-disable quotes, comma-spacing */
var PrecacheConfig = [["Vla1-Harmonics.mp3","f6871c737e94fe7c81b7a079d592f4cc"],["Vla2-Gliss.mp3","0e13f6704ea992912037345c505048ac"],["Vla3-Melody1.mp3","8a81c4b13bbd5b3668f7231572d0f383"],["Vla4-Melody2.mp3","08607f0582d4cc8bb5b9e50e7d514284"],["Vla5-Pizz.mp3","d17e808478212c346e1b057a5b938ae5"],["Vla6-Arp.mp3","2a2d3ccbda20ac529006da4a068fd79b"],["Vla7-WoodKnock.mp3","8adfb7b632053c48093928244905f0bb"],["Vla8-Trill-Bartok.mp3","3cd75c652dab8c06a882b66203a45caa"],["chorister.png","9654fa234c2b4aaae2925fd577728078"],["css/app.css","6c6aa83137b0394969db0bca477af906"],["css/bootstrap.css","4113f7aa3f6b14437817006013a262f9"],["fonts/glyphicons-halflings-regular.eot","2469ccfe446daa49d5c1446732d1436d"],["fonts/glyphicons-halflings-regular.svg","3b31e1de93290779334c84c9b07c6eed"],["fonts/glyphicons-halflings-regular.ttf","aa9c7490c2fd52cb96c729753cc4f2d5"],["fonts/glyphicons-halflings-regular.woff","7c4cbe928205c888831ba76548563ca3"],["index.html","8dc7c4e08aa78c04fa18eed42a2cb7a0"],["js/app.js","9f645ce09cbf6e2e59727543788bec96"],["js/birdSongPlayer.js","3d0fce0ac6091644d7f19c5051854c1a"],["js/bootstrap.js","f91d38466de6410297c6dcd8287abbca"],["js/jquery.min.js","397754ba49e9e0cf4e7c190da78dda05"],["js/offline-manager.js","28bd78ca4fcf8ae2b562c51a1cd2f5d3"],["js/placeTimeBirdSongs.js","0c7aafbe78901d93209c3f15c538d235"],["js/server.js","d04e609ae7df5a50ab36cfba9fc71952"],["org-mel1.mp3","4f3cffc69aa070cdb6a7c3fedfd06ef4"],["org-mel2.mp3","d9b647574c365e0bcd3e1fcd2eded442"],["org-mel3.mp3","afab0537c4ebd90f3328a0374bb9bb67"],["org-perc.mp3","d2661a94122d37a343999122d1044e95"],["org-shout.mp3","6dde1c84a9db08f85133f39e483d8f0d"],["org-stabs.mp3","736ba4bd94370d6ba471ac5fd9982fcc"],["org-sust1.mp3","adf468eb323277babac6e90c4b1e853e"],["saw440.mp3","e6b6ad83d622db8e8ecf11977b05a106"],["sqr440.mp3","c1e97f14bc9c84951f9f7a3b2265bc87"],["tapereel.png","84d502e8c5cd68e81273b5aa211b7ea1"]];
/* eslint-enable quotes, comma-spacing */
var CacheNamePrefix = 'sw-precache-v1--' + (self.registration ? self.registration.scope : '') + '-';


var IgnoreUrlParametersMatching = [/^utm_/];



var addDirectoryIndex = function (originalUrl, index) {
    var url = new URL(originalUrl);
    if (url.pathname.slice(-1) === '/') {
      url.pathname += index;
    }
    return url.toString();
  };

var populateCurrentCacheNames = function (precacheConfig, cacheNamePrefix, baseUrl) {
    var absoluteUrlToCacheName = {};
    var currentCacheNamesToAbsoluteUrl = {};

    precacheConfig.forEach(function(cacheOption) {
      var absoluteUrl = new URL(cacheOption[0], baseUrl).toString();
      var cacheName = cacheNamePrefix + absoluteUrl + '-' + cacheOption[1];
      currentCacheNamesToAbsoluteUrl[cacheName] = absoluteUrl;
      absoluteUrlToCacheName[absoluteUrl] = cacheName;
    });

    return {
      absoluteUrlToCacheName: absoluteUrlToCacheName,
      currentCacheNamesToAbsoluteUrl: currentCacheNamesToAbsoluteUrl
    };
  };

var stripIgnoredUrlParameters = function (originalUrl, ignoreUrlParametersMatching) {
    var url = new URL(originalUrl);

    url.search = url.search.slice(1) // Exclude initial '?'
      .split('&') // Split into an array of 'key=value' strings
      .map(function(kv) {
        return kv.split('='); // Split each 'key=value' string into a [key, value] array
      })
      .filter(function(kv) {
        return ignoreUrlParametersMatching.every(function(ignoredRegex) {
          return !ignoredRegex.test(kv[0]); // Return true iff the key doesn't match any of the regexes.
        });
      })
      .map(function(kv) {
        return kv.join('='); // Join each [key, value] array into a 'key=value' string
      })
      .join('&'); // Join the array of 'key=value' strings into a string with '&' in between each

    return url.toString();
  };


var mappings = populateCurrentCacheNames(PrecacheConfig, CacheNamePrefix, self.location);
var AbsoluteUrlToCacheName = mappings.absoluteUrlToCacheName;
var CurrentCacheNamesToAbsoluteUrl = mappings.currentCacheNamesToAbsoluteUrl;

function deleteAllCaches() {
  return caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        return caches.delete(cacheName);
      })
    );
  });
}

self.addEventListener('install', function(event) {
  var now = Date.now();

  event.waitUntil(
    caches.keys().then(function(allCacheNames) {
      return Promise.all(
        Object.keys(CurrentCacheNamesToAbsoluteUrl).filter(function(cacheName) {
          return allCacheNames.indexOf(cacheName) === -1;
        }).map(function(cacheName) {
          var url = new URL(CurrentCacheNamesToAbsoluteUrl[cacheName]);
          // Put in a cache-busting parameter to ensure we're caching a fresh response.
          if (url.search) {
            url.search += '&';
          }
          url.search += 'sw-precache=' + now;
          var urlWithCacheBusting = url.toString();

          console.log('Adding URL "%s" to cache named "%s"', urlWithCacheBusting, cacheName);
          return caches.open(cacheName).then(function(cache) {
            var request = new Request(urlWithCacheBusting, {credentials: 'same-origin'});
            return fetch(request.clone()).then(function(response) {
              if (response.ok) {
                return cache.put(request, response);
              }

              console.error('Request for %s returned a response with status %d, so not attempting to cache it.',
                urlWithCacheBusting, response.status);
              // Get rid of the empty cache if we can't add a successful response to it.
              return caches.delete(cacheName);
            });
          });
        })
      ).then(function() {
        return Promise.all(
          allCacheNames.filter(function(cacheName) {
            return cacheName.indexOf(CacheNamePrefix) === 0 &&
                   !(cacheName in CurrentCacheNamesToAbsoluteUrl);
          }).map(function(cacheName) {
            console.log('Deleting out-of-date cache "%s"', cacheName);
            return caches.delete(cacheName);
          })
        );
      });
    }).then(function() {
      if (typeof self.skipWaiting === 'function') {
        // Force the SW to transition from installing -> active state
        self.skipWaiting();
      }
    })
  );
});

if (self.clients && (typeof self.clients.claim === 'function')) {
  self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
  });
}

self.addEventListener('message', function(event) {
  if (event.data.command === 'delete_all') {
    console.log('About to delete all caches...');
    deleteAllCaches().then(function() {
      console.log('Caches deleted.');
      event.ports[0].postMessage({
        error: null
      });
    }).catch(function(error) {
      console.log('Caches not deleted:', error);
      event.ports[0].postMessage({
        error: error
      });
    });
  }
});


self.addEventListener('fetch', function(event) {
  if (event.request.method === 'GET') {
    var urlWithoutIgnoredParameters = stripIgnoredUrlParameters(event.request.url,
      IgnoreUrlParametersMatching);

    var cacheName = AbsoluteUrlToCacheName[urlWithoutIgnoredParameters];
    var directoryIndex = 'index.html';
    if (!cacheName && directoryIndex) {
      urlWithoutIgnoredParameters = addDirectoryIndex(urlWithoutIgnoredParameters, directoryIndex);
      cacheName = AbsoluteUrlToCacheName[urlWithoutIgnoredParameters];
    }

    if (cacheName) {
      event.respondWith(
        // We can't call cache.match(event.request) since the entry in the cache will contain the
        // cache-busting parameter. Instead, rely on the fact that each cache should only have one
        // entry, and return that.
        caches.open(cacheName).then(function(cache) {
          return cache.keys().then(function(keys) {
            return cache.match(keys[0]).then(function(response) {
              return response || fetch(event.request).catch(function(e) {
                console.error('Fetch for "%s" failed: %O', urlWithoutIgnoredParameters, e);
              });
            });
          });
        }).catch(function(e) {
          console.error('Couldn\'t serve response for "%s" from cache: %O', urlWithoutIgnoredParameters, e);
          return fetch(event.request);
        })
      );
    }
  }
});

