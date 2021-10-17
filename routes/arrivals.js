var express = require('express');
var router = express.Router();
const ensureIsAdmin = require('./../security_filter').ensureIsAdmin;
const Arrival = require("../mongoose_config").Arrival
const moment = require('moment-timezone')

router.post('', ensureIsAdmin, function(req, res, next) {

    const apartmentCode = req.body.apartmentCode
    const arrivalDate = req.body.arrivalDate
    const timezone = req.header('Time-Zone')

    findByApartmentCodeAndDate(apartmentCode, arrivalDate, timezone).then((arrivalEntity) => {
        if (!!arrivalEntity){
            res.status(400).send({ message : "Arrival already exists"})
            return;
        }
        arrivalEntity.save().then((savedEntity) => {
            res.status(201).send({ 
                savedEntity
            })
        }).catch ((error) => {
            res.status(400).send({
                message : "Error creating arrival"
            })
        })
    })    
});

router.get('/apartment/:apartmentCode', function(req, res, next) {

  const apartmentCode = req.params.apartmentCode
  let offset = req.query.offset
  let limit = req.query.limit

  Arrival.paginate( {'apartmentCode' : apartmentCode}, { 
    sort : { arrivalDate: "desc"}, 
    offset: offset,
    limit: limit
  }).then(arrivals => {
      if (!!arrivals){
          res.status(200).send(arrivals)
      } else {
          res.status(404).send({message: "Not Found"})
      }
  }).catch(() => {
      res.status(400).send({
          message : "Error retrieving arrival"
      })
  })
});

router.get('/date/:arrivalDate', function(req, res, next) {

    const arrivalDate = req.params.arrivalDate
    const tz = req.header('Time-Zone')

    const dateRange = getCleaningDateRange(new Date(parseInt(arrivalDate)), tz)

    let offset = req.query.offset
    let limit = req.query.limit
  
    Arrival.paginate( { 
        $and: [{'arrivalDate' : {$gte: dateRange.start, $lte: dateRange.end }}]
    }, { 
      sort : { arrivalDate: "asc"}, 
      offset: offset,
      limit: limit
    }).then(arrivals => {
        if (!!arrivals){
            res.status(200).send(arrivals)
        } else {
            res.status(404).send({message: "Not Found"})
        }
    }).catch(() => {
        res.status(400).send({
            message : "Error retrieving arrival"
        })
    })
});

router.get('/:apartmentCode/:arrivalDate', function(req, res, next) {

    const arrivalDate = req.params.arrivalDate
    const apartmentCode = req.params.apartmentCode
    const tz = req.header('Time-Zone')

    const dateRange = getCleaningDateRange(new Date(parseInt(arrivalDate)), tz)

    Arrival.findOne( { 
        $and: [{'arrivalDate' : {$gte: dateRange.start, $lte: dateRange.end }} , {'apartmentCode' : apartmentCode} ]
    }).then(arrival => {
        if (!!arrival){
            res.status(200).send(arrival)
        } else {
            res.status(404).send({message: "Not Found"})
        }
    }).catch(() => {
        res.status(400).send({
            message : "Error retrieving arrival"
        })
    })
});

router.put('/:apartmentCode/:arrivalDate', function(req, res, next) {

  const apartmentCode = req.params.apartmentCode
  const arrivalDate = req.params.arrivalDate
  const timezone = req.header('Time-Zone')

  let newData = req.body

  findByApartmentCodeAndDate(apartmentCode, arrivalDate, timezone).then((arrival) => {
      
    if (!arrival){
          res.status(404).send({message: "Not found"})
          return;
      }
      
      arrival.returnedKeys = newData.returnedKeys
      arrival.timeCleaned = newData.timeCleaned
      arrival.message = newData.message
      
      arrival.save().then((savedArrival) => {
          res.status(200).send(savedArrival)
      }).catch (() => {
          res.status(400).send({
              message : "Error modifying arrival"
          })
      })
  }).catch(() => {
      res.status(400).send({
          message : "Error modifiying arrival"
      })
  })
});

router.patch('/status/:apartmentCode/:arrivalDate', function(req, res, next) {

    const apartmentCode = req.params.apartmentCode
    const arrivalDate = req.params.arrivalDate
    const timezone = req.header('Time-Zone')

    let newData = req.body.cleaningStatus

    findByApartmentCodeAndDate(apartmentCode, arrivalDate, timezone).then((arrival) => {
            
        if (!arrival){
                res.status(404).send({message: "Not found"})
                return;
            }

            arrival.cleaningStatus.push({
                cleaningStatus: newData,
                changeStatusDate: Date.now()
            })
            
            arrival.save().then((savedArrival) => {
                res.status(200).send(savedArrival)
            }).catch (() => {
                res.status(400).send({
                    message : "Error modifying arrival"
                })
            })
        }).catch(() => {
            res.status(400).send({
                message : "Error modifiying arrival"
            })
        })
});

router.delete('/:apartmentCode/:arrivalDate', ensureIsAdmin, function(req, res, next) {

    const arrivalDate = req.params.arrivalDate
    const apartmentCode = req.params.apartmentCode
    const timezone = req.header('Time-Zone')

    const dateRange = getCleaningDateRange(new Date(parseInt(arrivalDate)), timezone)

    Arrival.findOneAndDelete({ 
        $and: [{'arrivalDate' : {$gte: dateRange.start, $lte: dateRange.end }} , {'apartmentCode' : apartmentCode} ]
    }).then(arrival => {
            if (!arrival){
                res.status(404).send({message: "Not found"})
                return;
            }
            res.status(200).send(arrival)
        }).catch(() => {
            res.status(400).send({
                message : "Error retrieving user"
            })
        })
});

function getCleaningDateRange(date, timezone){
    let start = new Date(moment(date).tz(timezone).startOf('day').utc());
    let end = new Date(moment(date).tz(timezone).endOf('day').utc());

    if (date.getHours() < 8){
        start.setHours(start.getHours() - 16) // 24 - 8 = 16 in order to ensure the cleaners have time to clean in their schedule asuming they start to clean at 6am to have more priority apartments done at 8am. they should start the previous day
        end.setHours(end.getHours() - 16)
    } else {
        start.setHours(start.getHours() + 8) // 8 in order to ensure the cleaners have time to clean in their schedule asuming they start to clean at 6am to have more priority apartments done at 8am.
        end.setHours(end.getHours() + 8)
    }
    return { start, end }
}

const findByApartmentCodeAndDate = function(apartmentCode, date, timezone) {
    return new Promise(function(resolve, reject) {
        
        const dateRange = getCleaningDateRange(new Date(parseInt(date)), timezone)

        Arrival.findOne( { 
            $and: [{'arrivalDate' : {$gte: dateRange.start, $lte: dateRange.end }} , {'apartmentCode' : apartmentCode} ]
        }).then(arrival => {
            resolve(arrival)
        }).catch((error) => {
            reject(error)
        })
    });
}



module.exports = router;
