var Promise = require('promise');
var ConfigServer = require('../config/server.js');
var socketio = require('socket.io');
var ChatServer = require('./game/ChatServer');
//routes

var GameServer = new Object();

GameServer.init = function(webApp) {
	var websocketServer = socketio(webApp);
	ChatServer.init(websocketServer);

	websocketServer.on('connection', function (socket) {
		ChatServer.addConnection(socket);
	});
}

module.exports = GameServer;