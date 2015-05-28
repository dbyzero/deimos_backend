var Promise = require('promise');
var ConfigServer = require('../config.js');
var socketio = require('socket.io');
var ChatServer = require('./websocket/ChatServer');
var GameServer = require('./websocket/GameServer');
var Generator = require('../tools/Generator');

var userList = [];
var socketIdToUsername = {};
var WebsocketServer = new Object();
var websocketConnection = null;


WebsocketServer.start = function(httpServer) {
	websocketConnection = socketio(httpServer);
	ChatServer.start(sendMessage);
	GameServer.start(sendMessage);

	//message routes
	websocketConnection.on('connection', function (socket) {

		var username = Generator.generateName();
		console.log(['Client ', socket.handshake.address.yellow, ' ('+username.grey+' - '+socket.id.toString().grey, ')', ' connected'.green].join(''));
		socketIdToUsername[socket.id] = username;

		GameServer.onConnection(socket,username);
		ChatServer.onConnection(socket,username);

		//routes
		socket.on('chat.message',			onChatMessage.bind(socket));
		socket.on('game.test2',				onCreateGameServer.bind(socket));
		socket.on('game.startServer',		onStartGameServer.bind(socket));
		socket.on('game.stopServer',		onStopGameServer.bind(socket));
		socket.on('game.destroyServer',		onDestroyGameServer.bind(socket));

		socket.on('disconnect',	onDisconnection.bind(socket));
	});
}

var sendMessage = function(channel, key, mess) {
	if(channel === null) {
		websocketConnection.emit(key,mess);
	} else {
		websocketConnection.to(channel).emit(key,mess);
	}
}

var onDisconnection = function() {
	var username = socketIdToUsername[this.id.toString()];
	console.log('Client '+this.handshake.address.yellow+' ('+this.id.toString().grey+')'+' disconnect'.red);
	delete socketIdToUsername[this.id.toString()];

	GameServer.onDisconnection.call(this,username);
	ChatServer.onDisconnection.call(this,username);
}

//routes actions
var onChatMessage = function(message) {
	var username = socketIdToUsername[this.id.toString()];
	ChatServer.onMessage.call(this,username,message);
}

var onCreateGameServer = function() {
	GameServer.createInstance();
}

var onDestroyGameServer = function(message) {
	GameServer.destroyInstance(message.data.serverName);
}

var onStartGameServer = function(message) {
	GameServer.startInstance(message.data.serverName);
}

var onStopGameServer = function(message) {
	GameServer.stopInstance(message.data.serverName);
}

module.exports = WebsocketServer;