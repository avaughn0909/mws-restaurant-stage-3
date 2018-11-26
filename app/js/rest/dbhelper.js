
class DBHelper {


	static get DATABASE_URL() {
		const port = 1337;
		return `http://localhost:${port}`;
	}


	static openDatabase() {
		return idb.open('restaurant-db', 1, upgradeDb => {
			switch(upgradeDb.oldVersion) {
			case 0:
			case 1:
				var restaurants = upgradeDb.createObjectStore('restaurants', {
					keyPath: 'id'
				});
				restaurants.createIndex('cuisine','cuisine_type');
				restaurants.createIndex('neighborhood','neighborhood');
			case 2:
				var reviews = upgradeDb.createObjectStore('reviews', {
					keyPath: 'id'
				});
				reviews.createIndex('restaurant','restaurant_id');
			case 3:
				var offline_reviews = upgradeDb.createObjectStore('offline_reviews', {keyPath: 'id'});
			}
		});
	}

	static getRestaurants() {
		return new Promise((resolve,reject) => {

			DBHelper.openDatabase().then(db => {
				let tx = db.transaction('restaurants');
				let store = tx.objectStore('restaurants');
				store.getAll().then(restaurants => {
					if (restaurants && restaurants.length > 0) {
						resolve(restaurants);
					} else {
						DBHelper.newSetRestaurants().then(listFromWeb => {
							resolve(listFromWeb);
						}).catch(reject);
					}
				});
			}).catch(reject);
		});
	}

	static getReviews(restaurantId) {
		return new Promise((resolve,reject) => {

			DBHelper.openDatabase().then(db => {
				let tx = db.transaction('reviews');
				let store = tx.objectStore('reviews').index('restaurant');
				store.getAll(restaurantId).then(result => {
					if (result && result.length > 0) {
						resolve(result);
					} else {
						DBHelper.newSetReviews(restaurantId).then(listFromWeb => {
							resolve(listFromWeb);
						}).catch(reject);
					}
				});
			}).catch(reject);
		});
	}

	static newSetReviews(restaurantId) {
		return new Promise((resolve,reject) => {

			fetch(DBHelper.DATABASE_URL + '/reviews?restaurant_id=' + restaurantId)
				.then(response => {
					response.json()
						.then(data => {
							DBHelper.openDatabase()
								.then(db => {
									var tx = db.transaction('reviews', 'readwrite');
									var store = tx.objectStore('reviews');
									data.forEach(element => {
										element.restaurant_id = parseInt(element.restaurant_id);
										element.rating = parseInt(element.rating);
										store.put(element);
									});
								});
							var event = new CustomEvent('reviews_updated', {detail: {restaurant_id: restaurantId}});
							document.dispatchEvent(event);
							return resolve(data);
						});
				});

		});
	}

	static storeOfflineReview(review) {
		DBHelper.openDatabase().then(db => {
			var tx = db.transaction('offline_reviews','readwrite');
			var store = tx.objectStore('offline_reviews');
			store.add({id: Date.now(), data: review});
		});
	}

	static getOfflineReviews() {
		return new Promise((resolve,reject) => {
			DBHelper.openDatabase().then(db => {
				var tx = db.transaction('offline_reviews');
				var store = tx.objectStore('offline_reviews');
				store.getAll().then(data => {
					return resolve(data);
				}).catch(e => {
					reject(e);
				});
			});
		});
	}

	static clearOfflineReviews() {
		return new Promise((resolve, reject) => {
			DBHelper.openDatabase().then(db => {
				var tx = db.transaction('offline_reviews', 'readwrite');
				tx.objectStore('offline_reviews').clear();
				return resolve();
			}).catch(reject);
		});
	}


	static newSetRestaurants() {
		return new Promise((resolve,reject) => {

			fetch(DBHelper.DATABASE_URL + '/restaurants')
				.then(response => {
					response.json()
						.then(restaurants => {
							DBHelper.openDatabase()
								.then(db => {
									var tx = db.transaction('restaurants', 'readwrite');
									var store = tx.objectStore('restaurants');
									restaurants.forEach(element => {
										element.is_favorite = element.is_favorite ? (element.is_favorite.toString() == 'true' ? true : false) : false;
										store.put(element);
									});
								});
							DBHelper.newSetReviews();
							return resolve(restaurants);
						});
				});

		});

	}


	static fetchRestaurantById(id, callback) {

		DBHelper.openDatabase()
			.then(db => {
				let tx = db.transaction('restaurants');
				let store = tx.objectStore('restaurants');
				store.get(parseInt(id))
					.then(result => {
						callback(null,result);
					}).catch((e) => {
						callback(e,null);
					});
			});
	}

	static fetchReviewsForRestaurantId(id) {
		return new Promise((resolve, reject) => {
			DBHelper.openDatabase()
				.then(db => {
					let tx = db.transaction('reviews');
					let store = tx.objectStore('reviews').index('restaurant');
					return store.getAll(parseInt(id))
						.then(resolve)
						.catch((e) => {
							console.error('Could not get reviews for Restaurant', e);
							resolve([]);
						});
				});
		});
	}


	static fetchRestaurantByCuisine(cuisine, callback) {
		DBHelper.openDatabase().then(db => {
			let tx = db.transaction('restaurants');
			let store = tx.objectStore('restaurants').index('cuisine');
			return store.get(cuisine);
		}).then(result => {
			callback(null,result);
		}).catch((e) => {
			callback(e,null);
		});
	}

	static fetchRestaurantByNeighborhood(neighborhood, callback) {

		DBHelper.openDatabase().then(db => {
			let tx = db.transaction('restaurants');
			let store = tx.objectStore('restaurants').index('neighborhood');
			return store.get(neighborhood);
		}).then(result => {
			callback(null,result);
		}).catch((e) => {
			callback(e,null);
		});
	}


	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {


		DBHelper.getRestaurants().then(results => {
			if (cuisine != 'all') { // filter by cuisine
				results = results.filter(r => r.cuisine_type == cuisine);
			}
			if (neighborhood != 'all') { // filter by neighborhood
				results = results.filter(r => r.neighborhood == neighborhood);
			}
			callback(null,results);
		}).catch((e) => {
			callback(e,null);
		});
	}


	static fetchNeighborhoods(callback) {
		DBHelper.getRestaurants().then(result => {
			const neighborhoods = result.map((v, i) => result[i].neighborhood);
			callback(null,neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i));
		});
	}

	
	static fetchCuisines(callback) {
		// Fetch all restaurants
		DBHelper.getRestaurants().then(result => {
			const cuisines = result.map((v, i) => result[i].cuisine_type);
			callback(null,cuisines.filter((v, i) => cuisines.indexOf(v) == i));
		});
	}

	/**
   * Restaurant page URL.
   */
	static urlForRestaurant(restaurant) {
		return (`./restaurant.html?id=${restaurant.id}`);
	}

	/**
   * Restaurant image URL.
   */
	static imageUrlForRestaurant(restaurant) {
		return (`/img/${restaurant.photograph}.jpg`);
	}

	/**
   * Map marker for a restaurant.
   */
	static mapMarkerForRestaurant(restaurant, map) {
		// https://leafletjs.com/reference-1.3.0.html#marker
		const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
			{title: restaurant.name,
				alt: restaurant.name,
				url: DBHelper.urlForRestaurant(restaurant)
			});
		marker.addTo(newMap);
		return marker;
	}

}
