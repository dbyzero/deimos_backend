var Promise = require('promise');
var DockerManager = require('./game/DockerManager');

var GameServer = new Object();
var containers = [];
var availablePorts = [40000,40002,40003,40004];
var freePorts = [];
var instanceByPorts = {};
var sendMessage = null;

var configServer = require('../../config/server');


GameServer.start = function(callbackSendMessage) {
	sendMessage = callbackSendMessage;
	console.log('Game Server '+'started'.green);
}

GameServer.getInstanceStatus = function(instanceId) {

}

GameServer.updateInstanceList = function() {
	return DockerManager.getActiveDockerContainer()
		.then(function(data){
			containers = {};
			var keys = Object.keys(data);
			for (var i = 0; i < keys.length; i++) {
				var container = data[keys[i]];
				if(container.image === configServer.dockerImageName) {
					containers[container.id] = container;
				}
			};
			return containers;
		})
		.catch(function(err){
			console.log('error:'+err);
		});
}

GameServer.showInstanceList = function() {
	GameServer.updateInstanceList()
		.then(function(containers){
			console.log(containers);
		})
		.catch(function(err){
			console.log('error:'+err);
		});
}

GameServer.startInstance = function() {
	if(availablePorts.length <= freePorts.length) {
		console.error('All port used')
	} else {
		var port = null;
		for (var i = 0; i < availablePorts.length; i++) {
			if(freePorts.indexOf(availablePorts[i]) === -1) {
				port = availablePorts[i];
			}
		};
		freePorts.push(port);
		DockerManager.startDocker(port)
			.then(function(){
				return GameServer.updateInstanceList();
			})
			.then(function(){
				console.log('game started');
			})
			.catch(function(err){
				console.log('error:'+err);
			});
	}
}

GameServer.stopInstance = function(instanceId) {
	console.log('stop');
}

GameServer.onConnection = function(socket,username) {
	console.log([username.grey, ' join Game Server'].join(''));
}

GameServer.onDisconnection = function(username) {
	console.log(username.grey + ' disconnect from Game Server');
}

module.exports = GameServer;