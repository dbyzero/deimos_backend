var Promise = require('promise');
var Docker = new require('dockerode');

var config = require('../../config.js');
var docker = new Docker({socketPath: '/var/run/docker.sock'});
var gameContainer = {};
var lastPortUsed = 20000;

var GameServer = new Object();
GameServer.start = function(callbackSendMessage) {
	return this.updateInstanceList()
		.then(function(){
			console.log('Game Server '+'started'.green);
		})
		.catch(function(err){
			throw err;
		});
}

GameServer.updateInstanceList = function() {
	return new Promise(function(resolv, reject){
		docker.listContainers(function (err, containers) {
			if(err) {
				reject(err);
			} else {
				var regex = new RegExp("^"+config.gameServerPrefix+"(.*)");
				containers.forEach(function (containerInfo) {
					var res = regex.exec(containerInfo.Names[0]);
					if(res) {
						console.log("Game detected : " + res[1]);
						gameContainer[containerInfo.Names[0]] = containerInfo.Ports[0].PublicPort;
						lastPortUsed = Math.max(lastPortUsed,containerInfo.Ports[0].PublicPort);
					}
				});
				resolv();
			}
		});
	})
}

GameServer.joinInstance = function(serverName) {
	return new Promise(function(resolv, reject) {
		if(!gameContainer[config.gameServerPrefix + serverName]) {
			//get a new port
			lastPortUsed++;
			docker.createContainer({"Image": config.dockerImageName, "name": config.gameServerPrefix + serverName}, function (err, container) {
				if(err){
					console.log(err);
					reject(err);
				} else {
					container.start({"PortBindings": { "80/tcp": [{"HostPort": lastPortUsed+""}] }}, function (err, data) {if(err) {
							console.log(err);
							reject(err);
						} else {
							console.log("Create container " + serverName);
							gameContainer[config.gameServerPrefix + serverName] = lastPortUsed+"";
							resolv(lastPortUsed);
						}
					});
				}
			});
		} else {
			resolv(gameContainer[config.gameServerPrefix + serverName]);
		}
	});
}

GameServer.leaveInstance = function(serverName) {
	//TODO
}

//callbacks

GameServer.onLogin = function(socket,username) {
	//send channel infos
	socket.emit('game.serverList', gameContainer);
	console.log([username.grey, ' connected to game server list'].join(''));
}

GameServer.onLeave = function(username) {
	//stub
}

module.exports = GameServer;