var app = require('express')();var colors = require('colors');var server = require('http').Server(app);var io = require('socket.io')(server);server.listen(1080);app.get('/', function (req, res) {	res.sendfile(__dirname + '/index.html');});messageCount = 0;totalUser = 0;channelUserList = {};socketIdToUsername = {};io.on('connection', function (socket) {	var referer = socket.handshake.headers.referer;	urlParts = (referer || '/').split('/');	urlParts.pop();	var channel = urlParts.join('/');	if(channel.length === 0) channel = "Global";	console.log(['Client ', socket.handshake.address.yellow, ' ('+socket.id.toString().grey, ')', ' connected'.green, ' join channel "', channel.cyan, '"'].join(''));	//join channals	socket.join('Global');	socket.join(channel);	var username = generateName();	//metrics and matrix	totalUser++;	socketIdToUsername[socket.id] = username;	if(channelUserList.hasOwnProperty(channel) === false) {		channelUserList[channel] = [];	}	channelUserList[channel].push(username);	//send channel infos	socket.emit('welcome',{		'username':username,		'channel':channel,		'users':channelUserList[channel]	});	//callbacks	socket.on('disconnect', function () {		console.log('Client '+socket.handshake.address.yellow+' ('+socket.id.toString().grey+')'+' disconnect'.red);		totalUser--;		delete socketIdToUsername[socket.id.toString()];		var idx = channelUserList[channel].indexOf(username);		channelUserList[channel].splice(idx,1);		io.to(channel).emit('newUserList',{'newList':channelUserList[channel]});	});	socket.on('message', function (message) {		console.log('New message: '+message.data.yellow+' for '+channel.cyan);		io.to(channel).emit('message',{'id':messageCount++,'message':message,'username':username});	});	io.to(channel).emit('newUserList',{'newList':channelUserList[channel]});});var generateName = function() {	var tones = ['a', 'e', 'i', 'o', 'u', 'y', 'ay', 'oi', 'oo', 'ee', 'en', 'an', 'ou'];	var forms = [		'q', 'w', 'r', 't', 'p', 's', 'd', 'f', 'g', 'h', 'k', 'j', 'l',		'z', 'x', 'c', 'v', 'b', 'n', 'm', 'th', 'wh', 'ch', 'sh'	];	var toneLength = tones.length;	var formLength = forms.length;	var length = parseInt(Math.random()*4+2);	var formTurn = true;	var name = "";	var i = 0 ;	while(i++ < length) {		if(formTurn) {			var idx = parseInt(Math.random() * formLength);			name += forms[idx];		} else {			var idx = parseInt(Math.random() * toneLength);			name += tones[idx];		}		formTurn = !formTurn;	}	var nameSplitted = name.split('');	nameSplitted[0] = nameSplitted[0].toUpperCase();	name = nameSplitted.join('');	return name;}