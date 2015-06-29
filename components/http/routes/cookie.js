var express = require('express');
var router = express.Router();
var cors = require('cors');

router.get('/', function(req, res, next) {
	res.status(200).sendFile(__dirname + '/templates/manageCookie.html');
});

module.exports = router;