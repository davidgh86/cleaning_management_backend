const moment = require('moment-timezone')

function getStartOfDateFromEpoch(epoch, timezone) {
    let tz = timezone
    let date = epoch
    date = new Date(date)
    date = new Date(moment(date).tz(tz).startOf('day').utc())
    return date
}

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

function getCleaningDateRangeNoOffset(date, timezone){
    let start = new Date(moment(date).tz(timezone).startOf('day').utc());
    let end = new Date(moment(date).tz(timezone).endOf('day').utc());

    return { start, end }
}

const models = { getStartOfDateFromEpoch, getCleaningDateRange, getCleaningDateRangeNoOffset }

module.exports = models;