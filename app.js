var HTTPServer = require('./components/HTTPServer');
var GameServer = require('./components/GameServer');
var Promise = require('promise');
var colors = require('colors');
var ConfigServer = require('./config/server.js')

HTTPServer.init()
	//we need httpServerResource to create gameServer
	.then(
		function (httpServer) {
			console.log('HTTP Server '+'initialized'.green+' on port '+ConfigServer.port.yellow);
			GameServer.init(httpServer);
			console.log('Game Server '+'initialized'.green+' on port '+ConfigServer.port.yellow);
		}
	)
	.catch(
		function (err) {
			console.log('Cannot initialize http server'.red+' Error:'+err);
		}
	);