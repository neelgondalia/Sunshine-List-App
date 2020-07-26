var express = require('express'),
	fs = require('fs'),
	hogan = require('hogan-express'),
	favicon = require('serve-favicon'),
	logger = require('morgan'),
	methodOverride = require('method-override'),
	session = require('express-session'),
	bodyParser = require('body-parser'),
	upload = require('multer')({ dest: 'uploads/' });

module.exports = function(app) {
	app.engine('html', hogan);

	app.set('env', process.env.NODE_ENV || 'development');
	app.set('port', process.env.PORT || 3000);
	app.set('view engine', 'html');
	
	app.use(favicon(__dirname + '/public/favicon.ico'));
	app.use(logger('dev'));
	app.use(methodOverride());
	app.use(session({
		resave: true,
		saveUninitialized: true,
		secret: 'mezjX2MkuP'
	}));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(express.static(__dirname + '/public'));

	app.all('*', function(req, res, next) {
		console.log('Global work for all routes');
		next();
	});

	return this;
};