var express = require('express');
var Promise = require('promise');
var ConfigServer = require('../config.js');
var http = require('http');

//routes

var HTTPServer = new Object();

HTTPServer.start = function() {
	var expressApp = new express();
	var httpServer = http.Server(expressApp);

	return new Promise(function(resolv,reject) {
		httpServer.listen(ConfigServer.port, function () {

			//routes
			expressApp.get('/', function (req, res) {
				res.send('ready');
			});

			//we return http server ressource because WebsocketServer need it
			resolv(httpServer);
		});
	});
}

module.exports = HTTPServer;