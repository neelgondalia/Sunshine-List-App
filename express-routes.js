/*
Write your own routes here.
*/

var mainRoutes = require('./routes/mainRoutes.js');

module.exports = function (app) {
	app.get('/', mainRoutes.index);
	app.get('/about-us', mainRoutes.aboutUs);
};
