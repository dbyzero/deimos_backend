var Promise = require('promise');
var colors = require('colors');

var ChatServer = new Object();
var sendMessage = null;

ChatServer.init = function(_callbackSendMessage) {
	sendMessage = _callbackSendMessage;
	console.log('Chat Server '+'initialized'.green);
}

var messageCount = 0;
var channelUserList = {};
var usernameToChannel = {};

ChatServer.onConnection = function(socket,username) {
	//calculing canal depending referer
	var channel = getChanalFromSocket(socket);

	//joining canals
	socket.join('Global');
	socket.join(channel);

	//metrics and user tracking
	usernameToChannel[username] = channel;
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
	sendMessage(channel,'chat.newUserList',{'newList':channelUserList[channel]});
	console.log([username.grey, ' join channel "', channel.cyan, '"'].join(''));
}

ChatServer.onDisconnection = function(username) {
	var channel = usernameToChannel[username];
	var idx = channelUserList[channel].indexOf(username);
	channelUserList[channel].splice(idx,1);
	console.log(username.grey + ' disconnect from Chat Server');
	sendMessage(channel,'chat.newUserList',{'newList':channelUserList[channel]});
}

ChatServer.onMessage = function(username,message) {
	var channel = usernameToChannel[username];
	console.log('New chat message: '+message.data.yellow+' for '+channel.cyan);
	sendMessage(channel,'chat.message',{'id':messageCount++,'message':message,'username':username});
}

var getChanalFromSocket = function(socket) {
	var referer = socket.handshake.headers.referer;
	urlParts = (referer || '/').split('/');
	urlParts.pop();
	var channel = urlParts.join('/');
	if(channel.length === 0) channel = "Global";
	return channel;
}

module.exports = ChatServer;