var ConfigServer = {
	'port':'80',
	'dockerGameServerImageName':'deimos_server',
	'dockerApiContainerName':'deimos_api_11',
	'apiURL':'http://172.19.0.2',
	'gameServerPrefix':"/deimos_game_",
	'deimosServerVolumePath':"/home/half/repository/deimos/deimos_server"
}

module.exports = ConfigServer;
