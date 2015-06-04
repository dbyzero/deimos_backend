var Promise = require('promise');
var ConfigServer = require('../config.js');
var socketio = require('socket.io');
var ChatServer = require('./websocket/ChatServer');
var GameServer = require('./websocket/GameServer');
var Generator = require('../tools/Generator');
var restify = require('restify');

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
		socket.on('login',					onLogin.bind(socket));
		socket.on('loggout',				onLoggout.bind(socket));
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
var onLogin = function(_data) {

	var clientSocket = this;
	var login = _data.data.login;
	var password = _data.data.password;


	//Login
	sendCredentials(login,password)
		.then(function(data){
			onLoginSuccess.call(clientSocket,login,data.sessionid);
		})
		//If fail try a logout then login again
		.catch(function(data){
			if(data.body.error === 'already_used') {
				console.log('Already connected to session '+data.body.sessionid);
				cleanSession(data.body.sessionid)
					.then(function(){
						console.log('Session '+data.body.sessionid+' removed');
						return sendCredentials(login,password)
					})
					.then(function(data){
						onLoginSuccess.call(clientSocket,login,data.sessionid);
					})
					.catch(function(data){
						clientSocket.emit('serverError',{'message':'cannot_connect'});
					})
			} else {
				clientSocket.emit('severError',{'message':'cannot_connect'});
			}
		})
};

var onLoginSuccess = function(login,sessionid) {
	console.log(login + ' loggued with session ' + sessionid);
	this.emit('loggued',{'login':login,'sessionid':sessionid});
};

//routes actions
var onLoggout = function(sessionid) {
	cleanSession(sessionid)
		.then(function(){
			console.log('Session '+sessionid+' removed');
		})
		.catch(function(data){
			console.log('Error '+data);
			clientSocket.emit('serverError',{'message':'cannot_clean_session'});
		});
}

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

var sendCredentials = function(login, password) {
	return new Promise(function(resolv,reject) {
		restify.createJsonClient({
			url: ConfigServer.apiURL,
			agent:false,
			headers:{
			}
		}).post(encodeURI('/account/register/'+login+'/'+password), function(err, req, res, data) {
			if(err !== null) {
				reject(err);
			}
			resolv(data);
		});
	});
}

var cleanSession = function(sessionid) {
	return new Promise(function(resolv,reject) {
		restify.createJsonClient({
			url: ConfigServer.apiURL,
			agent:false,
			headers:{
			}
		}).del(encodeURI('/session/unregister/'+sessionid), function(err, req, res, data) {
			if(err !== null) {
				reject(err);
			}
			resolv(data);
		});
	});
}

module.exports = WebsocketServer;