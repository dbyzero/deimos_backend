var Promise = require('promise');
var colors = require('colors');
var exec = require('child_process').exec;
var configServer = require('../../../config');

var DockerManager = function() {

}

DockerManager.startDocker = function (port) {
	return execCommand('docker run --name game_server_'+port+' -i -t -d -p '+port+':80 --link deimos_api:api '+configServer.dockerImageName,function(stdout,stderr){
	// execCommand('docker run -i -t -d -p port:1337 dbyzero:deimos_server:alpha',function(stdout,stderr){
		var containers = DockerManager.getActiveDockerContainer();
	});
}

DockerManager.stopDocker = function (dockerContainerId) {

}

DockerManager.destroyDockerContainer = function (dockerContainerName) {
	return execCommand('docker rm -f ' + dockerContainerName)
		.then(function(stdout,stderr){
			console.log('Container ' + dockerContainerName + ' removed');
		})
		.catch(function(err){
			throw new Error(__filename + '@destroyDockerContainer '+err);
		});
}

DockerManager.getActiveDockerContainer = function () {
	return execCommand('docker ps --no-trunc')
		.then(function(stdout,stderr){
			var data = [];
			var rows = stdout.split("\n");
			rows.shift();
			for(var i = 0;i < rows.length;i++) {
				var reg = /^(\S+)\s+(\S+).* (\S+)\s+(\S+)\s*$/;
				var match = rows[i].match(reg);
				if(match === null) continue;
				data.push({
					'id':		match[1],
					'image':	match[2],
					'port':		match[3].replace('0.0.0.0:','').replace('->80/tcp',''),
					'name':		match[4]
				});
			}
			return data;
		})
		.catch(function(err){
			throw new Error(__filename + '@showActiveContainer '+err);
		});
}

var execCommand = function(command) {
	var promise = new Promise(function(resolv,reject){
		exec(command, function (error, stdout, stderr) {
			if (error !== null) {
				console.log("Error executing  command:" + command.yellow + "\nError:".red + error + "\nStderr:\n".red + stderr);
				reject();
			}
			resolv(stdout, stderr);
		});
		
	});
	return promise;
}

module.exports = DockerManager;