
function getAppartementsFromAPIJson(jsonApiObject){
    let ids = jsonApiObject.scdata.property.map((property) => property.propertycode )
    return ids
}

function getAppartementInfoFromAPIJson(jsonApiObject){
    // TODO return names
    return jsonApiObject
}

module.exports = {getAppartementsFromAPIJson};