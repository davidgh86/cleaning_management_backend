var express = require('express');
var router = express.Router();
var appartementsService = require('../apparments_service')

/* GET users listing. */
router.get('/', function(req, res, next) {
  appartementsService.getAllAppartments.then((json) => {
    res.json(json)
  }).catch((error) => {
    res.send("Error")
  });
});

module.exports = router;
