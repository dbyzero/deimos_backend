var Promise = require('promise');
var ChatServer = new Object();
var websocketConnection = null;
var ConfigServer = require('../../config/server.js');
var Generator = require('../../tools/Generator');

ChatServer.init = function(websocketApp) {
	websocketConnection = websocketApp;
	console.log('Chat Server '+'initialized'.green+' on port '+ConfigServer.port.yellow);
}

var messageCount = 0;
var totalUser = 0;
var channelUserList = {};
var socketIdToUsername = {};
var socketIdToChannel = {};

ChatServer.addConnection = function(socket) {
	//calculing canal depending referer
	var channel = getChanalFromSocket(socket);
	var username = Generator.generateName();

	//joining canals
	socket.join('Global');
	socket.join(channel);

	//metrics and user tracking
	totalUser++;
	socketIdToUsername[socket.id] = username;
	socketIdToChannel[socket.id] = channel;
	if(channelUserList.hasOwnProperty(channel) === false) {
		channelUserList[channel] = [];
	}
	channelUserList[channel].push(username);

	//send channel infos
	socket.emit('chat.welcome',{
		'username':username,
		'channel':channel,
		'users':channelUserList[channel]
	});

	//broadcast incomming user
	websocketConnection.to(channel).emit('newUserList',{'newList':channelUserList[channel]});
	console.log(['Client ', socket.handshake.address.yellow, ' ('+username.grey+' - '+socket.id.toString().grey, ')', ' connected'.green, ' join channel "', channel.cyan, '"'].join(''));

	//callbacks
	socket.on('disconnect', onDisconnection);
	socket.on('message', onMessage);

}

var getChanalFromSocket = function(socket) {
	var referer = socket.handshake.headers.referer;
	urlParts = (referer || '/').split('/');
	urlParts.pop();
	var channel = urlParts.join('/');
	if(channel.length === 0) channel = "Global";
	return referer;
}

var onDisconnection = function() {
	var channel = socketIdToChannel[this.id.toString()];
	var username = socketIdToUsername[this.id.toString()];
	delete socketIdToUsername[this.id.toString()];
	var idx = channelUserList[channel].indexOf(username);
	channelUserList[channel].splice(idx,1);
	websocketConnection.to(channel).emit('chat.newUserList',{'newList':channelUserList[channel]});
	totalUser--;
	console.log('Client '+this.handshake.address.yellow+' ('+this.id.toString().grey+')'+' disconnect'.red);
}

var onMessage = function(message) {
	var channel = socketIdToChannel[this.id.toString()];
	var username = socketIdToUsername[this.id.toString()];
	console.log('New message: '+message.data.yellow+' for '+channel.cyan);
	websocketConnection.to(channel).emit('chat.message',{'id':messageCount++,'message':message,'username':username});
}

module.exports = ChatServer;