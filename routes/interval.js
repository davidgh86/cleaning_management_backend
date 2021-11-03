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
const { getStartOfDateFromEpoch, getCleaningDateRangeNoOffset } = require('../utils/timeUtils')

const saveRootPath = './uploaded_files'

let currentIntervals = []
let changeToReadyToCleanTask = {}

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
            calculateIntervalByDate(date, timezone)
                .then(intervals => res.status(200).send({bookings, intervals}))
                .catch(err => res.status(400).send(err))
        )
        .catch(err => 
            res.status(400).send(err)
        )

    // TODO add not cleaned apartments from previous days

});

function calculateIntervalByDate(date, timezone) {

    const dateRange = getCleaningDateRangeNoOffset(date, timezone)
    return new Promise((resolve, reject) => {
        Booking.find({ 
            $and: [{'checkInDate' : {$gte: dateRange.start, $lte: dateRange.end }}]
        }).populate('apartment').then(arrivals => {
            Booking.find({ 
                $and: [{'checkOutDate' : {$gte: dateRange.start, $lte: dateRange.end }}]
            }).populate('apartment').then(departures => {
                calculateIntervalsAndPersistApartmentStatusAndDepartures(arrivals, departures).then(response => {
                    response.forEach(interval => {
                        scheduleReadyToCleanChangeStatus(interval)
                    })
                    resolve(response)
                })
            }).catch(err => reject(err))
        }).catch(err => reject(err))
    })
}

function scheduleReadyToCleanChangeStatus(interval) {
    if (interval && interval.cleaningStatus && interval.occupiedUntil && interval.cleaningStatus === "OCCUPIED") {

        changeToReadyToCleanTask[interval.apartmentCode] = schedule.scheduleJob(date, function(){
            changeCleaningStatus(interval.apartmentCode, interval.bookingCode, "READY_TO_CLEAN")
            delete changeToReadyToCleanTask[interval.apartmentCode]
        });
    }
}

async function changeCleaningStatus(apartmentCode, bookingCode, newStatus) {
    for (let i = 0; i<currentIntervals; i++){
        if (currentIntervals[i].apartmentCode === apartmentCode) {
            currentIntervals[i].cleaningStatus = newStatus
            break;
        }
    }
    let updateInfo
    let dateNow = Date.now()
    let lastCleaningStatus = {
        cleaningStatus: newStatus,
        changeStatusDate: dateNow,
    }
    if (newStatus === "READY_TO_CLEAN" && !!bookingCode){
        updateInfo = {
            lastCleaningStatus,
            lastBookingCode: bookingCode
        }
    } else {
        updateInfo = {
            lastCleaningStatus
        }
    }
    await Apartment.findOneAndUpdate({"apartmentCode" : apartmentCode}, updateInfo)
    
    if (bookingCode) {
        booking = await Booking.findOne({"bookingCode": bookingCode})
        booking.cleaningStatusChangeLog.push(lastCleaningStatus)
        await booking.save()
    }
    // TODO emit ws event to updat front
    
}

function calculateIntervalsAndPersistApartmentStatusAndDepartures(arrivals, departures){

    return new Promise((resolve, reject) => {
        calculateIntervals(arrivals, departures).then(async ({departuresToUpdate, apartmentUpdateStatus, intervals}) => {
            currentIntervals = intervals
            departuresToUpdate.forEach(async departure => {
                await departure.save();
            })
            for (var key in apartmentUpdateStatus) {
                if (apartmentUpdateStatus[key].cleaningStatus){
                    await Apartment.findOneAndUpdate({"apartmentCode" : key}, { lastCleaningStatus : apartmentUpdateStatus[key]})
                }
            }
            resolve(intervals)
        })
    })
}

function calculateIntervals(arrivals, departures) {
    return new Promise(function (resolve, reject) {
    
        const departuresToUpdate = []
        const apartmentUpdateStatus = {}
        const intervals = []

        arrivalApartmentCodes = new Set(arrivals.map(arrival => arrival.apartment.apartmentCode))
        
        //Apartment.find({"apartmentCode": { $in : arrivalApartmentCodes }}).then((apartments) => apartments)

        departureApartmentCodesToBeOccupiedToday = new Set(departures.filter(departure => arrivalApartmentCodes.has(departure.apartment.apartmentCode)).map(departure => departure.apartment.apartmentCode));

        let processedDepartures = false
        let processedArrivals = 0
        arrivals.forEach(arrival=> {
            if (departureApartmentCodesToBeOccupiedToday.has(arrival.apartment.apartmentCode)){
                // arrivals when departure same day
                departures.forEach(departure => {
                    if (departure.apartment.apartmentCode === arrival.apartment.apartmentCode) {
                        updateDepartureStatus(departure, departuresToUpdate, apartmentUpdateStatus, intervals, "ARRIVAL", arrival.checkInDate);
                    }
                })
                processedArrivals = processedArrivals + 1
                if (processedArrivals === arrivals.length && processedDepartures){
                    resolve({departuresToUpdate, apartmentUpdateStatus, intervals})
                    return
                }
            } else {
                Apartment.findOne({"apartmentCode": arrival.apartment.apartmentCode}).then((apartment) => {
                    let cleaningStatus = null
                    if (apartment && apartment.lastCleaningStatus) {
                        cleaningStatus = apartment.lastCleaningStatus.cleaningStatus
                    }
                    intervals.push({
                        cleaningStatus: cleaningStatus,
                        limitTime: arrival.checkInDate,
                        occupiedUntil: null,
                        apartmentName: arrival.apartment.apartmentName,
                        apartmentCode: arrival.apartment.apartmentCode,
                        expectedKeys: arrival.apartment.expectedKeys,
                        // TODO add info of lastBookingCode to apartments
                        bookingCode: null,
                        priorityType: "ARRIVAL"
                    })
                })
                .catch(err => console.error(err))
                .finally(() => {
                    processedArrivals = processedArrivals + 1
                    if (processedArrivals === arrivals.length && processedDepartures){
                        resolve({departuresToUpdate, apartmentUpdateStatus, intervals})
                        return
                    }
                })
            }
        })

        departureApartmentCodesToBeOccupiedAnotherDay = new Set(departures.filter(departure => !arrivalApartmentCodes.has(departure.apartment.apartmentCode)))
        departureApartmentCodesToBeOccupiedAnotherDay.forEach(departure => {
            updateDepartureStatus(departure, departuresToUpdate, apartmentUpdateStatus, intervals, "DEPARTURE", null);
        })
        processedDepartures = true
        if (processedArrivals === arrivals.length){
            resolve({departuresToUpdate, apartmentUpdateStatus, intervals})
            return
        }
    });

}

function updateDepartureStatus(departure, departuresToUpdate, apartmentUpdateStatus, intervals, priorityType, limitTime) {
    let { currentStatus, newStatus, currentDate } = getStatusTransition(departure);
    if (currentStatus !== newStatus) {
        changeStatus = {
            cleaningStatus: newStatus,
            changeStatusDate: currentDate
        };
        departure.cleaningStatusChangeLog.push(changeStatus);
        departuresToUpdate.push(departure);
        apartmentUpdateStatus[departure.apartment.apartmentCode] = changeStatus;
    }

    intervals.push({
        cleaningStatus: (newStatus) ? newStatus : currentStatus,
        limitTime: limitTime,
        occupiedUntil: departure.checkOutDate,
        apartmentName: departure.apartment.apartmentName,
        apartmentCode: departure.apartment.apartmentCode,
        expectedKeys: departure.apartment.expectedKeys,
        bookingCode: departure.bookingCode,
        priorityType: priorityType
    });
}

function getStatusTransition(departure) {
    let currentStatus = null;
    if (departure.cleaningStatusChangeLog && departure.cleaningStatusChangeLog.length > 0) {
        currentStatus = departure.cleaningStatusChangeLog[departure.cleaningStatusChangeLog.length - 1];
    }
    let newStatus = null;
    let currentDate = Date.now();
    if (!currentStatus) {
        if (departure.checkOutDate > currentDate) {
            newStatus = 'OCCUPIED';
        } else {
            newStatus = 'READY_TO_CLEAN';
        }
    } else if (currentStatus === 'OCCUPIED') {
        if (departure.checkOutDate <= currentDate) {
            newStatus = 'READY_TO_CLEAN';
        }
    }
    return { currentStatus, newStatus, currentDate };
}

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
                    findApartmentAndInsertIfNotExisting(item).then(persistedApartment => {
                        
                        let apartment = objectId(persistedApartment._id)
                        let expectedKeys = parseKeys(item.Time)
                        let checkInTime = parseTime(item.Time)
                        let specifiedCheckInTime = !!checkInTime
                        let bookingCode = item.Booking

                        let checkInDate = getArrivalDateFromLocaleString(item.Arrival, timezone, checkInTime)
                        let checkOutDate = getDepartureDateFromLocaleString(item.Departure, timezone)

                        saveOrUpdateBooking({
                            apartment, expectedKeys, checkOutDate, specifiedCheckInTime, checkInDate, checkInTime, bookingCode
                        }, true).then(savedOrUpdated => {
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
                    findApartmentAndInsertIfNotExisting(item).then(persistedApartment => {
                        
                        let apartment = objectId(persistedApartment._id)
                        let expectedKeys = parseKeys(item.Time)
                        let checkOutTime = parseTime(item.Time)
                        let specifiedCheckOutTime = !!checkOutTime
                        let bookingCode = item.Booking

                        let checkInDate = getArrivalDateFromLocaleString(item.Arrival, timezone)
                        let checkOutDate = getDepartureDateFromLocaleString(item.Departure, timezone, checkOutTime)

                        saveOrUpdateBooking({
                            apartment, expectedKeys, checkInDate, specifiedCheckOutTime, checkOutDate, checkOutTime, bookingCode
                        }, false).then(savedOrUpdated => {
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

        Apartment.findOne({"apartmentCode": apartmentCode}).then((apartment) => {
            
            if (!apartment) {
                const newApartment = new Apartment({
                    apartmentCode: apartmentCode,
                    apartmentName: csvItem.Property,
                    keys: parseKeys(csvItem.Time)
                })
                newApartment.save().then((saved) => {
                    resolve(saved)
                }).catch((err) => {
                    Apartment.findOne({"apartmentCode": apartmentCode}).then((retry) => {
                        resolve(retry)
                    }).catch((err) => {
                        reject(err)
                    })
                })
            } else {
                resolve(apartment)
            }
        })
    })
}

function saveOrUpdateBooking(booking, isArrival) {
    return new Promise((resolve, reject) => {
        Booking.findOne({"bookingCode": booking.bookingCode, "apartment": booking.apartment}).then(persistedBooking => {
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
        })
    })
}

module.exports = router;
