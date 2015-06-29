var Promise = require('promise');
var ConfigServer = require('../../../config.js');
var restify = require('restify');

var LevelGenerator = new Object();

LevelGenerator.factory = function(config) {
	return new Promise(function(resolv,reject) {
		switch(config.type) {
			case 'home':
				if(!config.avatarId) {
					throw new Exception('Need avatar ID to create level. Given conf : '+config);
				}
				var level = 'home_'+config.avatarId;
				getLevel(level)
					.then(function(result){
						resolv(result);
					})
					.catch(function(err){
						if(err.statusCode === 404) {
							console.log('Creating level '+level);
							return buildingHomeLevel(config.avatarId);
						} else {
							reject(err);
						}
					})
					.then(function(result){
						resolv(result);
					})
					.catch(function(err){
						console.log(err);
						reject(err);
					});
				break;
			default:
				throw new Exception('Unknow type');
				break;
		}
	});
}

var getLevel = function(levelName) {
	return new Promise(function(resolv,reject) {
		restify.createJsonClient({
			url: ConfigServer.apiURL,
			agent:false,
			headers:{
			}
		}).get(encodeURI('/level/byname/'+levelName), function(err, req, res, data) {
			if(err !== null) {
				reject(err);
			}
			resolv(data);
		});
	});
}

var buildingHomeLevel = function(avatarId) {
	var level = {};
	level.name = 'home_'+avatarId;
	level.width = 675;
	level.height = 500;
	level.blocks =  [
		{
			"position" : {  "x" : 349, "y" : 349 },
			"height" : 10, "width" : 100,
			"type" : { "value" : 0, "type" : "block" },
			"id" : "block-1-by-id-testBlock",
			"vertexTL" : { "x" : 349, "y" : 349 },
			"vertexTR" : { "x" : 449, "y" : 349 },
			"vertexBL" : { "x" : 349, "y" : 359 },
			"vertexBR" : { "x" : 449, "y" : 359 }
		},
		{
			"position" : {  "x" : 49, "y" : 349 },
			"height" : 10, "width" : 200,
			"type" : { "value" : 0, "type" : "plateform" },
			"id" : "block-1-by-id-testBlock",
			"vertexTL" : { "x" : 49, "y" : 349 },
			"vertexTR" : { "x" : 249, "y" : 349 },
			"vertexBL" : { "x" : 49, "y" : 359 },
			"vertexBR" : { "x" : 249, "y" : 359 }
		}
	];

	return new Promise(function(resolv,reject) {
		restify.createJsonClient({
			url: ConfigServer.apiURL,
			agent:false,
			headers:{
			}
		}).post(encodeURI('/level/home_'+avatarId), level , function(err, req, res, data) {
			if(err !== null) {
				reject(err);
			}
			resolv(data);
		});
	});
}




module.exports = LevelGenerator;