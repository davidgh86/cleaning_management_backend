var express = require('express');
var router = express.Router();
const multer  = require('multer')
const fs = require('fs')
//const ensureIsAdmin = require('./../security_filter').ensureIsAdmin;
const parse = require('csv-parse');

const schedule = require('node-schedule');

const {Booking, Apartment} = require("../mongoose_config");
const objectId = require('mongoose').Types.ObjectId;
const { parseKeys, parseTime, getArrivalDateFromLocaleString, getDepartureDateFromLocaleString } = require('../utils/utils')
const { getStartOfDateFromEpoch } = require('../utils/timeUtils')

const saveRootPath = './uploaded_files'

// TODO check if file exists
const storage = multer.diskStorage({
    
    destination: function (req, file, cb) {
      cb(null, saveRootPath)
    },
    filename: function (req, file, cb) {
        let timezone = req.header('Time-Zone')
        let date = getStartOfDateFromEpoch(parseInt(req.body.date), timezone)
        let fileName = date.getTime() + ".csv"
        if (fs.existsSync(saveRootPath+"/"+fileName)){
            fs.unlinkSync(saveRootPath+"/"+fileName)
        }
        cb(null, fileName )
    }
  })

const upload = multer({ storage })
  
router.post('/upload', upload.single('file'), function(req, res, next) {
    
    let timezone = req.header('Time-Zone')
    let date = getStartOfDateFromEpoch(parseInt(req.body.date), timezone)

    updateValuesInMemory(date, timezone)
        .then(bookings => 
            res.status(200).send(bookings)
        )
        .catch(err => 
            res.status(400).send(err)
        )
});


function updateValuesInMemory(date, timezone) {
    return new Promise((resolve, reject) => {
        let fileName = date.getTime() + ".csv"

        let arrivals = []
        let departures = []
        let arrivalsComplete = false
        let departureComplete = false

        fs.readFile(saveRootPath+"/"+fileName, 'utf8', function (err, data) {
            if (err) {
                reject(err)
                return
            }

            let filesContent = data.split(/\r?\n\r?\n/)
            let arrivalsCsv = filesContent[1]
            parse(arrivalsCsv, {
                columns: true,
                delimiter: ",",
                trim: true
            }, function(err, records){
                if (err){
                    reject(err)
                    return
                }
                let count = 0
                records.forEach((item) => {
                    findApartmentAndInsertIfNotExisting(item)
                    .then(persistedApartment => {
                        
                        let apartment = objectId(persistedApartment._id)
                        let expectedKeys = parseKeys(item.Time)
                        let checkInTime = parseTime(item.Time)
                        let specifiedCheckInTime = !!checkInTime
                        let bookingCode = item.Booking

                        let checkInDate = getArrivalDateFromLocaleString(item.Arrival, timezone, checkInTime)
                        let checkOutDate = getDepartureDateFromLocaleString(item.Departure, timezone)

                        saveOrUpdateBooking({
                            apartment, expectedKeys, checkOutDate, specifiedCheckInTime, checkInDate, checkInTime, bookingCode
                        }, true)
                        .then(savedOrUpdated => {
                            count = count + 1;
                            arrivals.push(savedOrUpdated)
                            if (count === records.length){
                                arrivalsComplete = true
                            }
                            if (arrivalsComplete && departureComplete){
                                resolve({arrivals, departures})
                                return
                            }
                        }).catch(error => {
                            count = count + 1;
                            console.error(error)
                        })
                    }).catch(error => {
                        count = count + 1;
                        console.error(error)
                    })
                })
            })
            let departuresCvs = filesContent[3]
            parse(departuresCvs, {
                columns: true,
                delimiter: ",",
                trim: true
            }, function(err, records){
                if (err){
                    reject(err)
                    return
                }
                let count = 0;
                records.forEach((item) => {
                    findApartmentAndInsertIfNotExisting(item)
                    .then(persistedApartment => {
                        
                        let apartment = objectId(persistedApartment._id)
                        let expectedKeys = parseKeys(item.Time)
                        let checkOutTime = parseTime(item.Time)
                        let specifiedCheckOutTime = !!checkOutTime
                        let bookingCode = item.Booking

                        let checkInDate = getArrivalDateFromLocaleString(item.Arrival, timezone)
                        let checkOutDate = getDepartureDateFromLocaleString(item.Departure, timezone, checkOutTime)

                        saveOrUpdateBooking({
                            apartment, expectedKeys, checkInDate, specifiedCheckOutTime, checkOutDate, checkOutTime, bookingCode
                        }, false)
                        .then(savedOrUpdated => {
                            count = count + 1;
                            departures.push(savedOrUpdated)
                            if (count === records.length){
                                departureComplete = true
                            }
                            if (arrivalsComplete && departureComplete){
                                resolve({arrivals, departures})
                                return
                            }
                        }).catch(error => {
                            count = count + 1;
                            console.error(error)
                        })
                    }).catch(error => {
                        count = count + 1;
                        console.error(error)
                    })
                })
            })
        });
    });
}

function findApartmentAndInsertIfNotExisting(csvItem) {
    return new Promise((resolve, reject) => {
        let apartmentCode = parseInt(csvItem["Property ID"])

        Apartment.findOne({"apartmentCode": apartmentCode})
        .then((apartment) => {
            
            if (!apartment) {
                const newApartment = new Apartment({
                    apartmentCode: apartmentCode,
                    apartmentName: csvItem.Property,
                    keys: parseKeys(csvItem.Time)
                })
                newApartment.save()
                .then((saved) => {
                    resolve(saved)
                    return
                }).catch((err) => {
                    Apartment.findOne({"apartmentCode": apartmentCode})
                    .then((retry) => {
                        resolve(retry)
                        return
                    }).catch((err) => {
                        reject(err)
                        return 
                    })
                })
            } else {
                resolve(apartment)
                return
            }
        }).catch(error => reject(error))
    })
}

function saveOrUpdateBooking(booking, isArrival) {
    return new Promise((resolve, reject) => {
        Booking.findOne({"bookingCode": booking.bookingCode, "apartment": booking.apartment})
        .then(persistedBooking => {
            if (!persistedBooking) {
                const newBooking = new Booking(booking)
                newBooking.save()
                    .then((savedBooking) => resolve(savedBooking))
                    .catch((error) => reject(error))
            } else {
                if (isArrival){
                    persistedBooking.apartment = booking.apartment
                    persistedBooking.expectedKeys = booking.expectedKeys
                    persistedBooking.checkOutDate = booking.checkOutDate
                    persistedBooking.specifiedCheckInTime = booking.specifiedCheckInTime
                    persistedBooking.checkInDate = booking.checkInDate
                    persistedBooking.checkInTime = booking.checkInTime
                    persistedBooking.bookingCode = booking.bookingCode
                } else {
                    persistedBooking.apartment = booking.apartment
                    persistedBooking.expectedKeys = booking.expectedKeys
                    persistedBooking.checkInDate = booking.checkInDate
                    persistedBooking.specifiedCheckOutTime = booking.specifiedCheckOutTime
                    persistedBooking.checkOutDate = booking.checkOutDate
                    persistedBooking.checkOutTime = booking.checkOutTime
                    persistedBooking.bookingCode = booking.bookingCode
                }
                persistedBooking.save()
                    .then((savedBooking) => resolve(savedBooking))
                    .catch((error) => reject(error))
            }
        }).catch(error => reject(error))
    })
}

module.exports = router;
