var express = require('express');
var router = express.Router();
const ensureIsAdmin = require('./../security_filter').ensureIsAdmin;
const Booking = require("../mongoose_config").Booking
//const objectId = require('mongodb').ObjectID;
const objectId = require('mongoose').Types.ObjectId;

const { getCleaningDateRange } = require('../utils/timeUtils')

router.post('', ensureIsAdmin, function(req, res, next) {

    const apartmentId = req.body.apartmentId
    const checkInDate = req.body.checkInDate
    const checkOutDate = req.body.checkOutDate
    // const timezone = req.header('Time-Zone')

    checkBookingBetweenDates(apartmentId, checkInDate, checkOutDate).then((existsBooking) => {
        if (existsBooking){
            res.status(400).send({ message : "Booking existing at that moment"})
            return;
        }
        const newBooking = new Booking(req.body)
        newBooking.save().then((savedEntity) => {
            res.status(201).send(savedEntity)
        }).catch ((error) => {
            res.status(400).send({
                message : "Error creating booking"
            })
        })
    })    
});

router.get('', function(req, res, next) {

    let offset = req.query.offset
    let limit = req.query.limit
  
    Booking.paginate( {}, { 
      sort : { checkInDate: "desc"}, 
      offset: offset,
      limit: limit,
      populate: 'apartment'
    }).then(bookings => {
        if (!!bookings){
            res.status(200).send(bookings)
        } else {
            res.status(404).send({message: "Not Found"})
        }
    }).catch(() => {
        res.status(400).send({
            message : "Error retrieving bookings"
        })
    })
  });

router.get('/apartment/:apartmentId', function(req, res, next) {

  const apartmentId = req.params.apartmentId
  let offset = req.query.offset
  let limit = req.query.limit

  Booking.paginate( {'apartment' : objectId(apartmentId)}, { 
    sort : { checkInDate: "desc"}, 
    offset: offset,
    limit: limit,
    populate: 'apartment'
  }).then(bookings => {
      if (!!bookings){
          res.status(200).send(bookings)
      } else {
          res.status(404).send({message: "Not Found"})
      }
  }).catch(() => {
      res.status(400).send({
          message : "Error retrieving booking"
      })
  })
});

router.get('/date/:checkInDate', function(req, res, next) {

    const checkInDate = req.params.checkInDate
    const tz = req.header('Time-Zone')

    const dateRange = getCleaningDateRange(new Date(parseInt(checkInDate)), tz)

    let offset = req.query.offset
    let limit = req.query.limit
  
    Booking.paginate( { 
        $and: [{'checkInDate' : {$gte: dateRange.start, $lte: dateRange.end }}]
    }
    , { 
      sort : { checkInDate: "asc"}, 
      offset: offset,
      limit: limit,
      populate: "apartment"
    }
    ).then(bookings => {
        if (!!bookings){
            res.status(200).send(bookings)
        } else {
            res.status(404).send({message: "Not Found"})
        }
    }).catch(() => {
        res.status(400).send({
            message : "Error retrieving booking"
        })
    })
});

router.get('/:apartmentId/:checkInDate', function(req, res, next) {

    const checkInDate = req.params.checkInDate
    const apartmentId = req.params.apartmentId
    const tz = req.header('Time-Zone')

    const dateRange = getCleaningDateRange(new Date(parseInt(checkInDate)), tz)

    Booking.findOne( { 
        $and: [{'checkInDate' : {$gte: dateRange.start, $lte: dateRange.end }} , {'apartmentId' : apartmentId} ]
    }).then(booking => {
        if (!!booking){
            res.status(200).send(booking)
        } else {
            res.status(404).send({message: "Not Found"})
        }
    }).catch(() => {
        res.status(400).send({
            message : "Error retrieving booking"
        })
    })
});

router.put('/:apartmentId/:checkInDate', function(req, res, next) {

  const apartmentId = req.params.apartmentId
  const checkInDate = req.params.checkInDate
  const timezone = req.header('Time-Zone')

  let newData = req.body

  findByapartmentIdAndDate(apartmentId, checkInDate, checkOutDate).then((booking) => {
      
    if (!booking){
          res.status(404).send({message: "Not found"})
          return;
      }
      
      booking.returnedKeys = newData.returnedKeys
      booking.timeCleaned = newData.timeCleaned
      booking.message = newData.message
      
      booking.save().then((savedBooking) => {
          res.status(200).send(savedBooking)
      }).catch (() => {
          res.status(400).send({
              message : "Error modifying booking"
          })
      })
  }).catch(() => {
      res.status(400).send({
          message : "Error modifiying booking"
      })
  })
});

router.patch('/status/:apartmentId/:checkInDate', function(req, res, next) {

    const apartmentId = req.params.apartmentId
    const checkInDate = req.params.checkInDate
    
    const timezone = req.header('Time-Zone')

    let newData = req.body.cleaningStatus

    findByapartmentIdAndDate(apartmentId, checkInDate, timezone).then((booking) => {
            
        if (!booking){
                res.status(404).send({message: "Not found"})
                return;
            }

            booking.cleaningStatus.push({
                cleaningStatus: newData,
                changeStatusDate: Date.now()
            })
            
            booking.save().then((savedBooking) => {
                res.status(200).send(savedBooking)
            }).catch (() => {
                res.status(400).send({
                    message : "Error modifying booking"
                })
            })
        }).catch(() => {
            res.status(400).send({
                message : "Error modifiying booking"
            })
        })
});

router.delete('/:apartmentId/:checkInDate', ensureIsAdmin, function(req, res, next) {

    const checkInDate = req.params.checkInDate
    const apartmentId = req.params.apartmentId
    const timezone = req.header('Time-Zone')

    const dateRange = getCleaningDateRange(new Date(parseInt(checkInDate)), timezone)

    Booking.findOneAndDelete({ 
        $and: [{'checkInDate' : {$gte: dateRange.start, $lte: dateRange.end }} , {'apartmentId' : apartmentId} ]
    }).then(booking => {
            if (!booking){
                res.status(404).send({message: "Not found"})
                return;
            }
            res.status(200).send(booking)
        }).catch(() => {
            res.status(400).send({
                message : "Error retrieving user"
            })
        })
});

const checkBookingBetweenDates = function(apartmentId, startDate, endDate) {
    // TODO check if add offset
    return new Promise(function(resolve, reject) {
        Booking.exists({
            $or: [
                { $and: [{'checkInDate' : {$gte: startDate, $lte: endDate }} , {'apartmentId' : apartmentId}] },
                { $and: [{'checkOutDate' : {$gte: startDate, $lte: endDate }} , {'apartmentId' : apartmentId}] }
            ]
        })
        .then((result) => {resolve(result)})
        .catch((error) => {reject(error)})
    });
}

const findByapartmentIdAndDate = function(apartmentId, date, timezone) {
    return new Promise(function(resolve, reject) {
        
        const dateRange = getCleaningDateRange(new Date(parseInt(date)), timezone)

        Booking.findOne( { 
            $and: [{'checkInDate' : {$gte: dateRange.start, $lte: dateRange.end }} , {'apartmentId' : apartmentId} ]
        }).then(booking => {
            resolve(booking)
        }).catch((error) => {
            reject(error)
        })
    });
}



module.exports = router;
