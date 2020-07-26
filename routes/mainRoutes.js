exports.index = function(req, res) {
	res.render('index.html', {
		partials: {
			head: 'partials/head.html'
		}
	});
};

exports.aboutUs = function(req, res) {
	res.render('about-us.html', {
		title: 'About Us',
		dumpValues: req.headers,
		partials: {
			head: 'partials/head.html'
		}
	});
};
