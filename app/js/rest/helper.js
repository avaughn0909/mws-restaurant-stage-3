
isOnline = () => {
	document.querySelector('body').classList.remove('offline');
	DBHelper.getOfflineReviews().then(reviews => {
		DBHelper.clearOfflineReviews().then(() => {
			reviews.forEach((review) => handleSubmit(review.data));
		});
	});
};

isOffline = () => {
	document.querySelector('body').classList.add('offline');
};

window.addEventListener('online',  isOnline);
window.addEventListener('offline', isOffline);
