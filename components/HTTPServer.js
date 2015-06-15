var express = require('express');
var Promise = require('promise');
var ConfigServer = require('../config.js');
var http = require('http');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cookieRoutes = require('./http/routes/cookie');

//routes

var HTTPServer = new Object();

HTTPServer.start = function() {
	var app = new express();
	var httpServer = http.Server(app);

	return new Promise(function(resolv,reject) {
		httpServer.listen(ConfigServer.port, function () {

			app.use(bodyParser.json());
			app.use(cookieParser());
			app.set('view engine', 'jade');
			app.use(express.static(__dirname + '/http/templates'));
			// app.configure(function() {
			// });
			//routes
			app.get('/', function (req, res) {
				res.sendStatus(403);
			});
			app.use('/cookie', cookieRoutes);

			//we return http server ressource because WebsocketServer need it
			resolv(httpServer);
		});
	});
}

module.exports = HTTPServer;