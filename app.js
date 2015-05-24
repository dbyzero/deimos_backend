var HTTPServer = require('./components/HTTPServer');
var WebsocketServer = require('./components/WebsocketServer');
var Promise = require('promise');
var colors = require('colors');
var ConfigServer = require('./config/server.js')

HTTPServer.start()
	//we need httpServerResource to create gameServer
	.then(
		function (httpServer) {
			console.log('HTTP Server '+'initialized'.green+' on port '+ConfigServer.port.yellow);
			WebsocketServer.start(httpServer);
			console.log('Websocket Server '+'initialized'.green);
		}
	)
	.catch(
		function (err) {
			console.log('Cannot initialize http server'.red+' Error:'+err);
		}
	);