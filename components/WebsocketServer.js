var Promise = require('promise');
var ConfigServer = require('../config.js');
var socketio = require('socket.io');
var ChatServer = require('./websocket/ChatServer');
var GameServer = require('./websocket/GameServer');
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

		console.log(['Client ', socket.handshake.address.yellow, ' ('+socket.id.toString().grey, ')', ' connected'.green].join(''));

		//routes
		socket.on('login',					onLogin.bind(socket));
		socket.on('loginBySessionId',		onLoginBySessionId.bind(socket));
		socket.on('disconnect',				onDisconnection.bind(socket));
		socket.on('error',					function(err){throw Error(err);});
	});
}

//routes actions
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

	if(username !== undefined) {
		GameServer.onLeave.call(this,username);
		ChatServer.onLeave.call(this,username);
	}
}

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

var onLoginBySessionId = function(_data) {

	var clientSocket = this;
	var login = _data.data.login;
	var sessionid = _data.data.sessionid;

	checkSessionId(login,sessionid)
		.then(function(data){
			onLoginSuccess.call(clientSocket,login,sessionid);
		})
		.catch(function(data){
			clientSocket.emit('sessionRevoked','Cannot valid session token id');
		})
};

var onLoginSuccess = function(login,sessionid) {
	console.log(login + ' loggued with session ' + sessionid);

	socketIdToUsername[this.id] = login;

	GameServer.onLogin(this,login);
	ChatServer.onLogin(this,login);

	this.on('loggout',				onLoggout.bind(this));
	this.on('chat.message',			onChatMessage.bind(this));
	this.on('game.test2',			onCreateGameServer.bind(this));
	this.on('game.startServer',		onStartGameServer.bind(this));
	this.on('game.stopServer',		onStopGameServer.bind(this));
	this.on('game.destroyServer',	onDestroyGameServer.bind(this));
	this.on('game.initLevel',		onInitGameServer.bind(this));
	this.emit('loggued',{'login':login,'sessionid':sessionid});
};

var onLoggout = function(sessionid) {

	cleanSession(sessionid)
		.then(function(){
			console.log('Session '+sessionid+' removed');
		})
		.catch(function(data){
			console.log('Error '+data);
			clientSocket.emit('serverError',{'message':'cannot_clean_session'});
		});


	var clientUsername = socketIdToUsername[this.id];
	GameServer.onLeave.call(this,clientUsername);
	ChatServer.onLeave.call(this,clientUsername);

	this.removeAllListeners('loggout');
	this.removeAllListeners('chat.message');
	this.removeAllListeners('game.test2');
	this.removeAllListeners('game.startServer');
	this.removeAllListeners('game.stopServer');
	this.removeAllListeners('game.destroyServer');
	this.removeAllListeners('game.initLevel');
}

var onChatMessage = function(message) {
	var username = socketIdToUsername[this.id.toString()];
	ChatServer.onMessage.call(this,username,message);
}

var onCreateGameServer = function(level) {
	GameServer.createInstance(level);
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

var onInitGameServer = function(message) {
	GameServer.initLevel(message.config);
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
var checkSessionId = function(login, sessionid) {
	return new Promise(function(resolv,reject) {
		restify.createJsonClient({
			url: ConfigServer.apiURL,
			agent:false,
			headers:{
			}
		}).get(encodeURI('/session/check/'+login+'/'+sessionid), function(err, req, res, data) {
			if(err !== null) {
				console.log(err);
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
				console.log(err);
				reject(err);
			}
			resolv(data);
		});
	});
}

module.exports = WebsocketServer;