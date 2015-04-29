var express = require('express');
var Promise = require('promise');
var routes = require('./http/routes');
var ConfigServer = require('../config/server.js');
var http = require('http');

//routes

var HTTPServer = new Object();

HTTPServer.init = function() {
	var expressApp = new express();
	var httpServer = http.Server(expressApp);
	return new Promise(function(resolv,reject) {
		httpServer.listen(ConfigServer.port,function(){
			routes.init(expressApp);
			resolv(httpServer);
		});
	});
}

module.exports = HTTPServer;