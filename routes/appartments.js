var express = require('express');
var router = express.Router();
//var appartementsService = require('../apparments_service')
const Apartment = require("../mongoose_config").Apartment
const ensureIsAdmin = require('./../security_filter').ensureIsAdmin;

router.post('', ensureIsAdmin, function(req, res, next) {
  
  const apartmentEntity = new Apartment(req.body)
  
  apartmentEntity.save().then((savedEntity) => {
      res.status(201).send({ 
          savedEntity
      })
  }).catch (() => {
      res.status(400).send({
          message : "Error creating apartment"
      })
  })
});

router.get('', function(req, res, next) {
  
  let offset = req.query.offset
  let limit = req.query.limit
  
  Apartment.paginate({}, { 
      sort : { apartmentName: "asc"}, 
      offset: offset,
      limit: limit
  }).then((retrievedApartments) => {
      res.status(200).send(retrievedApartments)
  }).catch (() => {
      res.status(400).send({
          message : "Error retrieving apartments"
      })
  })
});

router.get('/:apartmentCode', function(req, res, next) {

  const apartmentCode = req.params.apartmentCode

  Apartment.findOne( {'code' : apartmentCode} ).then(apartment => {
      if (!!apartment){
          res.status(200).send(apartment)
      } else {
          res.status(404).send({message: "Not Found"})
      }
  }).catch(() => {
      res.status(400).send({
          message : "Error retrieving apartment"
      })
  })
});

router.put('/:apartmentCode', ensureIsAdmin, function(req, res, next) {

  const apartmentCode = parseInt(req.params.apartmentCode)

  let newData = req.body

  if (apartmentCode !== req.body.code){
      res.status(400).send({
          message : "Not valid data"
      });
      return;
  }

  Apartment.findOne( {'code' : apartmentCode} ).then(apartment => {
      if (!apartment){
          res.status(404).send({message: "Not found"})
          return;
      }
      
      apartment.apartmentName = newData.apartmentName
      apartment.keys = newData.keys
      
      apartment.save().then((savedApartment) => {
          res.status(200).send(savedApartment)
      }).catch (() => {
          res.status(400).send({
              message : "Error creating user"
          })
      })
  }).catch(() => {
      res.status(400).send({
          message : "Error retrieving user"
      })
  })
});

router.delete('/:apartmentCode', ensureIsAdmin, function(req, res, next) {

  const apartmentCode = req.params.apartmentCode

  Apartment.findOneAndDelete( {'code' : apartmentCode} ).then(apartment => {
      if (!apartment){
          res.status(404).send({message: "Not found"})
          return;
      }
      res.status(200).send(apartment)
  }).catch(() => {
      res.status(400).send({
          message : "Error retrieving user"
      })
  })
});

module.exports = router;
