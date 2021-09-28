var express = require('express');
const { ws } = require('./users');
const ws_server = require('./../ws_server')
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
  ws_server.send("message");
});

module.exports = router;
