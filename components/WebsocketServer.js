var Promise = require('promise');
var ConfigServer = require('../config.js');
var socketio = require('socket.io');
var ChatServer = require('./websocket/ChatServer');
var GameServer = require('./websocket/GameServer');
var restify = require('restify');

var userList = [];
var socketIdToAccountName = {};
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
		socket.on('register',				onRegister.bind(socket));
		socket.on('createCharacter',		onCreateCharacter.bind(socket));
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
	var username = socketIdToAccountName[this.id.toString()];
	console.log('Client '+this.handshake.address.yellow+' ('+this.id.toString().grey+')'+' disconnect'.red);
	delete socketIdToAccountName[this.id.toString()];

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
						//warning potential infinite loop
						return sendCredentials(login,password);
					})
					.then(function(data){
						onLoginSuccess.call(clientSocket,login,data.sessionid);
					})
					.catch(function(data){
						console.log(data);
						clientSocket.emit('serverError',{'message':'cannot_connect #1'});
					})
			} else {
				clientSocket.emit('severError',{'message':'cannot_connect #2'});
			}
		})
};

var onRegister = function(_data) {
	var clientSocket = this;
	var login = _data.data.login;
	var password = _data.data.password;
	var mail = _data.data.mail;

	register(login,password,mail)
		.then(function(data){
			onLogin.call(clientSocket,_data);
		})
		.catch(function(err){
			if(err.body.error === 'user_exist') {
				clientSocket.emit('serverError',{'message':'userExist'});
			} else {
				clientSocket.emit('serverError',{'message':err});
			}
		})
};

var onCreateCharacter = function(_data) {
	var clientSocket = this;
	var account_name = _data.data.account_name;

	//check
	if(socketIdToAccountName[clientSocket.id] !== account_name) {
		clientSocket.emit('serverError',{'message':new Error('Forbidden')});
		return;
	}

	createCharacter(_data['data'])
		.then(function(data){
			onAvatarCreated.call(clientSocket,data);
		})
		.catch(function(err){
			if(err.body.error === 'avatar_exist') {
				console.log(err);
				clientSocket.emit('serverError',{'message':'avatarExist'});
			} else {
				console.log(err);
				clientSocket.emit('serverError',{'message':err});
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

	socketIdToAccountName[this.id] = login;

	GameServer.onLogin(this,login);
	ChatServer.onLogin(this,login);

	this.on('loggout',				onLoggout.bind(this));
	this.on('chat.message',			onChatMessage.bind(this));
	this.on('game.test2',			onCreateGameServer.bind(this));
	this.on('game.startServer',		onStartGameServer.bind(this));
	this.on('game.stopServer',		onStopGameServer.bind(this));
	this.on('game.destroyServer',	onDestroyGameServer.bind(this));
	this.on('game.initLevel',		onInitGameServer.bind(this));

	//we add chars to the answer
	getCharactersAccount(login)
		.then(function(characters){
			this.emit('loggued',{
				'login':login,
				'sessionid':sessionid,
				'characters':characters
			});

		}.bind(this))
		.catch(function(error){
			console.log(error);
			this.emit('serverError',{'message':'cannot_get_characters'});
		}.bind(this));

};

var onAvatarCreated = function(data) {
	this.emit('avatarCreated',{'avatar':data});
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


	var clientUsername = socketIdToAccountName[this.id];
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
	var username = socketIdToAccountName[this.id.toString()];
	ChatServer.onMessage.call(this,username,message);
}

var onCreateGameServer = function(level) {
	GameServer.createInstance(level)
		.then(function(){
			//TODO
		})
		.catch(function(err){
			this.emit('serverError',{'message':'cannot_create_server'});
		});
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

var register = function(login, password, mail) {
	return new Promise(function(resolv,reject) {
		restify.createJsonClient({
			url: ConfigServer.apiURL,
			agent:false,
			headers:{
			}
		}).post(encodeURI('/account/create/'+login+'/'+password+'/'+mail), function(err, req, res, data) {
			if(err !== null) {
				reject(err);
			}
			resolv(data);
		});
	});
}

var createCharacter = function(data) {
	console.log(data);
	return new Promise(function(resolv,reject) {
		restify.createJsonClient({
			url: ConfigServer.apiURL,
			agent:false,
			headers:{
			}
		//we copy data to not send client unwanted data
		}).post(
			encodeURI('/avatar/create/'+data['account_name']+'/'+data['name']),
			data,
			function(err, req, res, _data) {
				if(err !== null) {
					reject(err);
				}
				delete _data._id;
				delete _data.__v;
				resolv(_data);
			});
	});
}

var getCharactersAccount = function(account) {
	return new Promise(function(resolv,reject) {
		restify.createJsonClient({
			url: ConfigServer.apiURL,
			agent:false,
			headers:{
			}
		}).get(encodeURI('/avatar/byowner/'+account), function(err, req, res, data) {
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
