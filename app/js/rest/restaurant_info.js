let restaurant;
var map;
var bool_favoriteImage ;
const port = 1337;
const api_host = 'http://localhost:${port}/';

document.addEventListener('DOMContentLoaded', (event) => {
 	initMap();
});


initMap = () => {
 	fetchRestaurantFromURL((error, restaurant) => {
 		if (error) { // Got an error!
 			console.error(error);
 		} else {
 			self.newMap = L.map('map', {
 				center: [restaurant.latlng.lat, restaurant.latlng.lng],
 				zoom: 16,
 				scrollWheelZoom: false
 			});
 			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
 				mapboxToken: 'pk.eyJ1IjoiYXZhdWdobjA5MDkiLCJhIjoiY2ppdnYzN3lnMnhreTNqcmZubHB5dmlqOCJ9.UvxxyLlqqm7KPXNFrJwrTw',
 				maxZoom: 18,
 				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
           '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
           'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
 				id: 'mapbox.streets'
 			}).addTo(newMap);
 			fillBreadcrumb();
 			DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
 		}
 	});
};


fetchRestaurantFromURL = (callback) => {


	if (self.restaurant) {
		callback(null, self.restaurant);
		return;
	}
	const id = getParameterByName('id');
	if (!id) {
		error = 'No restaurant id in URL';
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			getFavoriteImage(restaurant.is_favorite);
			newGetReviews(id).then(function() {
				fillReviewsHTML();
			});

			callback(null, restaurant);
		});
	}
};

newGetReviews = (id) =>{
	return DBHelper.getReviews(id).then(reviews => {
		if(!reviews){
			console.log('Error getting reviews');
		}else{
			self.restaurant.reviews = reviews;
		}
	}) .catch(error => {
		console.log(error);
	});
};


clearForm =() =>{

	document.getElementById('name').value = '';
	document.getElementById('rating').selectedIndex = 0;
	document.getElementById('comments').value = '';
};


getNewReview = () => {

	const review = {};
	const ratingSelect = document.getElementById('rating');
	const rating = ratingSelect.options[ratingSelect.selectedIndex].value;
	const restId = getParameterByName('id');
	review['name'] = document.getElementById('name').value;
	review['rating'] = rating;
	review['comments'] = document.getElementById('comments').value;
	review['restaurant_id'] = restId;

	return review;
};

handleSubmit = () => {

	const review = getNewReview();
	if (!review) return;

	const url = `${DBHelper.DATABASE_URL}/reviews/`;
	const POST = {
		method: 'POST',
		body: JSON.stringify(review)
	};

	return fetch(url, POST).then(response => {
		if (!response.ok) return Promise.reject('Something went wrong');
		return response.json();
	})
		.then(netReview => {

			const reviewList = document.getElementById('reviews-list');
			const review = createReviewHTML(netReview);
			reviewList.appendChild(review);

			clearForm();

		}).catch(e => {
  		console.error(e);
  		DBHelper.storeOfflineReview(review).then(offlineReview =>{

				const reviewList = document.getElementById('reviews-list');
  			const rev = createReviewHTML(offlineReview);
  			reviewList.appendChild(rev);
				clearForm();
			});
		});

};





fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img';
	image.src = DBHelper.imageUrlForRestaurant(restaurant);

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;


	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews
	//fillReviewsHTML();
};


fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);

		hours.appendChild(row);
	}
};


fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');

	if (!reviews || !reviews.length) {
		const noReviews = document.createElement('p');
		noReviews.setAttribute('tabindex','0');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	ul.innerHTML = '';
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
	container.appendChild(ul);
};

createReviewHTML = (review) => {
	const li = document.createElement('li');
	const section = document.createElement('section');
	const name = document.createElement('span');
	name.innerHTML = review.name;
	name.classList.add('reviewer-name');
	name.setAttribute('tabindex','0');
	section.appendChild(name);

	const date = document.createElement('span');
	date.innerHTML = new Date(review.updatedAt).toLocaleDateString();
	date.classList.add('date');
	date.setAttribute('tabindex','0');
	section.appendChild(date);
	li.appendChild(section);

	const rating = document.createElement('span');
	rating.innerHTML = `Rating: ${review.rating}`;
	rating.classList.add('rating');
	rating.setAttribute('tabindex','0');
	li.appendChild(rating);

	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	comments.setAttribute('tabindex','0');
	li.appendChild(comments);

	return li;
};



fillBreadcrumb = (restaurant=self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	li.setAttribute('aria-current','page');
	breadcrumb.appendChild(li);
};


getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
};




toggleFavorite = () => {
	self.restaurant.is_favorite = !self.bool_favoriteImage;
	getFavoriteImage(self.restaurant.is_favorite) ;
	const url = 'http://localhost:1337/restaurants/' + self.restaurant.id + '/?is_favorite=' + (self.restaurant.is_favorite);

	var headers = new Headers();
	headers.set('Accept', 'application/json');
	var fetchOptions = {
		method: 'PUT',
		headers
	};
	fetch(url, fetchOptions)
		.then(DBHelper.newSetRestaurants);
} ;

getFavoriteImage = (is_favorite) => {
	var favorite11 = document.getElementById('myFavoriteImage');
	if (is_favorite) {
		favorite11.setAttribute('src' , 'img/favorite.png');
		self.bool_favoriteImage = true ;
	}
	else
	{
		favorite11.setAttribute('src' , 'img/unfavorite.png');
		self.bool_favoriteImage = false ;
	}

};
(() =>{getFavoriteImage(restaurant.is_favorite);});
