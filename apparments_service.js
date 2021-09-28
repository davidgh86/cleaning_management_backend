const NodeCache = require( "node-cache" );
const axios = require('axios');
const xml2js = require('xml2js');
const mapper = require('./mapper')

const xmlParser = new xml2js.Parser()

const apiClient = axios.create({
    baseURL: 'https://api.supercontrol.co.uk',
    timeout: 3000
  });

const allAppartmentsIdCache = new NodeCache({ stdTTL: 86400, checkperiod: 21600 });
const allAppartmentsCache = new NodeCache({ stdTTL: 86400, checkperiod: 21600 });

const ALL_APPARTMENTS_IDS_CACHE_KEY = "allAppartmentsIdKey"

const getAllAppartmentIds = new Promise((resolve, reject)=>{
  let appartementsIds = allAppartmentsIdCache.get(ALL_APPARTMENTS_CACHE_KEY);
  if (appartementsIds == undefined){
    apiClient.get('/xml/filter3.asp?siteID=68&propertycode_only=1').then(response => {
      xmlParser.parseStringPromise(response.data).then(json => {
        appartementsIds = mapper.getAppartementsFromAPIJson(json)
        allAppartmentsIdCache.set(ALL_APPARTMENTS_CACHE_KEY, appartementsIds)
        resolve(appartementsIds)
      }).catch(error => {
        console.log(error)
        reject(error)
      })
    }).catch(error => {
      console.log(error)
      reject(error)
    })
  } else {
    resolve(appartementsIds)
  }
})

const getAppartementById = (appartementId) =>
{
 return new Promise((resolve, reject) =>
 {
  getAllAppartmentIds().then(allAppartmentsIds => {
    if (allAppartmentsIds.includes(appartementId)){
      let appartementInfo = allAppartmentsCache.get(appartementId)
      if (appartementInfo == undefined){
        apiClient.get(`/xml/property_xml.asp?id=${appartementId}&siteID=68`).then((response) => {
          xmlParser.parseStringPromise(response.data).then(json => {
            appartementInfo = mapper.getAppartementInfoFromAPIJson(json)
            allAppartmentsCache.set(appartementId, appartementInfo)
            resolve(appartementsIds)
          }).catch(error => {
            console.log(error)
            reject(error)
          })
        }).catch((error) => reject(error))
      }else{
        resolve(appartementInfo)
      }
    } else {
      reject(Error("Appartement not exist."))
    }
  }).catch(reject(Error("Error retrieving all ids")))
  
 });
};

module.exports = {
    getAllAppartmentIds
};
