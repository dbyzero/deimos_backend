var Promise = require('promise');
var ConfigServer = require('../config.js');
var socketio = require('socket.io');
var ChatServer = require('./websocket/ChatServer');
var GameServer = require('./websocket/GameServer');
var restify = require('restify');
var Docker = require('dockerode');


var userList = [];
var socketIdToAccountName = {};
var WebsocketServer = new Object();
var websocketConnection = null;


WebsocketServer.start = function(httpServer) {
	websocketConnection = socketio(httpServer);
	ChatServer.start(sendMessage);
	GameServer.start(sendMessage)
		.done(function(){
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
		},function(err){
			throw err;
		})

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
		.done(function(data){
			onLoginSuccess.call(clientSocket,login,data.sessionid);
		//If fail try a logout then login again
		},function(data){
			if(data.body.error === 'already_used') {
				console.log('Already connected to session '+data.body.sessionid);
				cleanSession(data.body.sessionid)
					.then(function(){
						console.log('Session '+data.body.sessionid+' removed');
						//warning potential infinite loop
						return sendCredentials(login,password);
					})
					.done(function(data){
						onLoginSuccess.call(clientSocket,login,data.sessionid);
					},function(data){
						console.log(data);
						clientSocket.emit('serverError',{'message':'cannot_connect #1'});
					});
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
		.done(function(data){
			onLogin.call(clientSocket,_data);
		},function(err){
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
		.done(function(data){
			onAvatarCreated.call(clientSocket,data);
		},function(err){
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
		.done(function(data){
			onLoginSuccess.call(clientSocket,login,sessionid);
		},function(data){
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
	this.on('game.joinServer',		onJoinGameServer.bind(this));
	this.on('game.leaveServer',		onLeaveGameServer.bind(this));

	//we add chars to the answer
	getCharactersAccount(login)
		.done(function(characters){
			this.emit('loggued',{
				'login':login,
				'sessionid':sessionid,
				'characters':characters
			});
		}.bind(this),
		function(error){
			console.log(error);
			this.emit('serverError',{'message':'cannot_get_characters'});
		}.bind(this));

};

var onAvatarCreated = function(data) {
	this.emit('avatarCreated',{'avatar':data});
};

var onLoggout = function(sessionid) {

	cleanSession(sessionid)
		.done(function(){
			console.log('Session '+sessionid+' removed');
		},function(data){
			console.log('Error '+data);
			clientSocket.emit('serverError',{'message':'cannot_clean_session'});
		});


	var clientUsername = socketIdToAccountName[this.id];
	GameServer.onLeave.call(this,clientUsername);
	ChatServer.onLeave.call(this,clientUsername);

	this.removeAllListeners('loggout');
	this.removeAllListeners('chat.message');
	this.removeAllListeners('game.joinServer');
	this.removeAllListeners('game.leaveServer');
}

var onChatMessage = function(message) {
	var username = socketIdToAccountName[this.id.toString()];
	ChatServer.onMessage.call(this,username,message);
}

var onJoinGameServer = function(message) {
	var that = this;
	GameServer.joinInstance(message.data.serverName)
		.done(function(serverInfo){
			//TODO
			that.emit('game.readyToJoinGame',{'message':serverInfo});
			console.log(serverInfo);
		},function(err){
			throw err;
		})
}

var onLeaveGameServer = function(message) {
	GameServer.leaveInstance(message.data.serverName);
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
	//add unsettable by user datas
	data['item_slot_chest'] = {
		id:3,
		color:'#3e3d3dff'
	};
	data['item_slot_left_hand'] =  {
		id:4,
		color:'#4e392fff'
	};
	data['item_slot_right_hand'] =  {
		id:1,
		color:'#ffb22eff'
	};
	data['item_slot_foot'] =  {
		id:2,
		color:'#832020ff'
	};
	data['item_slot_head'] = {};
	data['item_slot_head2'] = {};
	data['inventory'] = {};
	data['mass'] = 1;
	data['size'] = { x: 40, y: 60 };
	data['deltashow'] = { x: 30, y: 30 };

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
