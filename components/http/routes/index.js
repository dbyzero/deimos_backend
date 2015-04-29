var routes = new Object();

routes.init = function(webServer) {
	//test route
	webServer.get('/', function (req, res) {
		res.send('ready');
	});
}

module.exports = routes;