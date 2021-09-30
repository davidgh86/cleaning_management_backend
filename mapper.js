
function getAppartementsFromAPIJson(jsonApiObject){
    let ids = jsonApiObject.scdata.property.flatMap((property) => property.propertycode )
    return ids
}

function getAppartementInfoFromAPIJson(jsonApiObject){
    // TODO return names
    let jsonAppartementProperty = jsonApiObject.scdata.property[0]
    // TODO check if checkout or checkin ask andres

    result = { id : jsonAppartementProperty.propertycode[0] }

    if (jsonAppartementProperty.propertyname && jsonAppartementProperty.propertyname.length >= 1 ){
        result.propertyname = jsonAppartementProperty.propertyname[0]
    }

    if (jsonAppartementProperty.checkout && jsonAppartementProperty.checkout.length >= 1 ){
        result.checkout = jsonAppartementProperty.checkout[0]
    }   

    return result;
}

module.exports = {getAppartementsFromAPIJson, getAppartementInfoFromAPIJson};