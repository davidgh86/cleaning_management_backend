const moment = require('moment-timezone')

const keyRegexGroup = /(^|\s+)(?<numberOfKeys>\d+)\s*(K|k)(E|e)(Y|y)(S|s)?(\s+|$)/
const timeRegexGroup = /(^|\s+)(?<time>(0|1|2)?\d:\d{2})(\s+|$)/

function parseKeys(value){
    if (!value){
        return null
    }
    let match = keyRegexGroup.exec(value.trim())
    if (match != null){
        keysNumber = match.groups.numberOfKeys
        return parseInt(keysNumber)
    }else{
        return null
    }
}

function parseTime(value){
    if (!value){
        return null
    }
    let match = timeRegexGroup.exec(value.trim())
    if (match != null){
        timeValue = match.groups.time
        return timeValue
    }else{
        return null
    }
}

function getDateFromLocaleString(localeString, timeZone, time){
    let dateString = localeString.substr(4) + " " + time
    return moment.tz(dateString, "DD MMM YYYY h:mm", timeZone).toDate()
}

function getArrivalDateFromLocaleString(localeString, timeZone, time){
    if (time){
        return getDateFromLocaleString(localeString, timeZone, time)
    }
    return getDateFromLocaleString(localeString, timeZone, "15:30")
}

function getDepartureDateFromLocaleString(localeString, timeZone, time){
    if (time){
        return getDateFromLocaleString(localeString, timeZone, time)
    }
    return getDateFromLocaleString(localeString, timeZone, "10:30")
}

const models = { parseKeys, parseTime, getDateFromLocaleString, getArrivalDateFromLocaleString, getDepartureDateFromLocaleString }

module.exports = models;