var HTTPServer = require('./components/HTTPServer');
var WebsocketServer = require('./components/WebsocketServer');
var Promise = require('promise');
var colors = require('colors');
var ConfigServer = require('./config.js')

console.log("Configuration used :")
console.log(ConfigServer)

HTTPServer.start()
	//we need httpServerResource to create gameServer
	.then(
		function (httpServer) {
			console.log('HTTP Server '+'initialized'.green+' on port '+ConfigServer.port.yellow);
			WebsocketServer.start(httpServer);
		}
	)
	.catch(
		function (err) {
			console.log('Cannot initialize http server'.red+' Error:'+err);
		}
	);