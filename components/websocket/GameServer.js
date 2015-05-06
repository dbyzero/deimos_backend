var Promise = require('promise');

var GameServer = new Object();
var gameStarted = [];
var sendMessage = null;

GameServer.init = function(callbackSendMessage) {
	sendMessage = callbackSendMessage;
	console.log('Game Server '+'initialized'.green);
}

GameServer.onConnection = function(socket,username) {
	console.log([username.grey, ' join Game Server'].join(''));
}

GameServer.onDisconnection = function(username) {
	console.log(username.grey + ' disconnect from Game Server');
}

module.exports = GameServer;