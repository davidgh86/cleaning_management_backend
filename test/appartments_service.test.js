//const apparments_service = require('./../apparments_service');
const mapper = require('../mapper')

test('test mapper', () => {

  const inputJson = '{	"scdata": {"$": {	"version": "3"},"property": [	{"propertycode": [	"83136"],"lastupdate": [	"05/07/2019 08:00:35"],"enabled": [	"1"],"photolastupdate": [	""],"specialoffers": [	""]	},	{"propertycode": [	"415953"],"lastupdate": [	"22/09/2017 08:13:06"],"enabled": [	"1"],"photolastupdate": [	"13/04/2020 15:15:09"],"specialoffers": [	""]	}],"currency": [	{"_": "&pound;","$": {	"code": "GBP"}	}],"pagecontent": [	{"title": [	""],"metadescription": [	""],"metakeywords": [	""],"content": [	""],"header": [	""],"headerphoto": [	""],"headerurl": [	""],"linktext": [	""]	}],"towndata": [	{"title": [	""],"metadescription": [	""],"metakeywords": [	""],"content": [	""],"header": [	""]	}],"regiondata": [	{"regionname": [	""],"title": [	""],"metadescription": [	""],"metakeywords": [	""],"content": [	""],"header": [	""],"photo": [	""]	}],"countrydata": [	{"title": [	""],"metadescription": [	""],"metakeywords": [	""],"content": [	""],"header": [	""],"photo": [	""]	}],"showpage": [	"1"],"maxpages": [	"1"],"startdate": [	""],"enddate": [	""],"numbernights": [	""],"ownerID": [	"2"],"use_custom_photo": [	"0"],"variables": [	""],"runtime": [	"SQL start: 0.03125 SQL end: 0.328125 Loop start: 0.3359375 Var start: 1.429688 Var end: 1.429688 Total time: 1.429688 Server: CPVIIS68 Price cache: False"],"maxpax": [	{"_": "16","$": {	"adults": "16",	"children": "16",	"infants": "16"}	}],"propertycount": [	"185"],"primarybackgroundcolor": [	"#417bb7"]	}}'
  let json = JSON.parse(inputJson)
  mapper(json)

});