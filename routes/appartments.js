var express = require('express');
var router = express.Router();
var appartementsService = require('../apparments_service')

/* GET users listing. */
router.get('/', function(req, res, next) {
  appartementsService.getAllAppartmentIds.then((json) => {
    res.json(json)
  }).catch((error) => {
    res.send(error.message)
  });
});

/* GET users listing. */
router.get('/renew/:appartementId', function(req, res, next) {
  let appartementId = req.params.appartementId;
  appartementsService.getAppartementByIdRenew(appartementId).then((json) => {
    res.json(json)
  }).catch((error) => {
    res.send(error.message)
  });
});

module.exports = router;
