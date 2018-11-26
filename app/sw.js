'use strict';

//Cache Variables
const cache_Name = 'restaurant-sw-3';
const contentImgsCache = 'restaurant-img-1';



const cached_Items = [
	'/manifest.json',
	'/',
	'/restaurant.html',
	'/js/rest.js',
	'/css/style1.css',
	'/css/responsive.css',
	'/js/index.js'
];




//Function to install Service Worker
self.addEventListener('install', function(event) {
	event.waitUntil(
		caches.open(cache_Name)
			.then(function(cache) {
				console.log('Opened cache');
				return cache.addAll(cached_Items);
			})
	);
});

//Function to activate Service Worker
self.addEventListener('activate', function(event) {
	event.waitUntil(
		// Gets the keys from cache
		caches.keys().then(function(cacheNames) {
			// Used to wait until all promises care completed before deleting and adding in new cache
			return Promise.all(
				// Filter out cache names not used by restaurant finder
				cacheNames.filter(function(cacheName) {
					// Returns caches names that start with restaurant- that does not match our new cache
					return cacheName.startsWith('restaurant-') && cacheName !== cache_Name;
				})
				// Deletes Old Cache out and puts new cache in
					.map(function(cacheName) {
						return caches.delete(cacheName);
					})
			);
		})
	);
});

//Function to fetch items out of the cache
self.addEventListener('fetch', function(event) {

	const requestUrl = new URL(event.request.url);

	if (requestUrl.origin === location.origin) {

		// Since restaurants has parameters (id) we cannot request it out
		//of cache so instead we just response with the page itself
		if (requestUrl.pathname.startsWith('/restaurant.html')) {
			event.respondWith(caches.match('/restaurant.html'));
			return; // Exit if request matches
		}

		// If pathname starts with img respone with cached img
		if (requestUrl.pathname.startsWith('/img')) {
			event.respondWith(servecachedImage(event.request));
			return; // Exit if request matches
		}
	} event.respondWith(
		// Searches cache for URL requested
		caches.match(event.request)
			.then(function(response) {
				// Returns the URL if there OR reponds with a request event
				return response || fetch(event.request);
			})
	);
});

function servecachedImage(request) {
	let imageStorageUrl = request.url;

	return caches.open(contentImgsCache).then(function(cache) {
		return cache.match(imageStorageUrl).then(function(response) {
			// if image is in cache, return it, else fetch from network, cache a clone, then return network response
			return response || fetch(request).then(function(networkResponse) {
				cache.put(imageStorageUrl, networkResponse.clone());
				return networkResponse;
			});
		});
	});
}
