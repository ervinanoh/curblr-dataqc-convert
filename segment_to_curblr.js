// curblrizes a geojson output from sharedstreets-js

const fs = require('fs');
const path = require('path');

const inputGeojson = fs.readFileSync('data/mtl-subset-segment.joined.geojson');
const input = JSON.parse(inputGeojson);
const rpaCodeJson = fs.readFileSync('data/signalisation-codification-rpa_withRegulation.json');
let rpaCode = JSON.parse(rpaCodeJson).reduce((acc,val)=>{acc[val.TYPE_CODE]=val; return acc;},{});
//const agregateRpaCodeJson = fs.readFileSync('data/agregate-pannonceau-rpa.json');
//const agregateRpaCode = JSON.parse(agregateRpaCodeJson);

//rpaCode = {...rpaCode, ...agregateRpaCode}

var geojson = {};
geojson['type'] = 'FeatureCollection';
geojson['features'] = [];

for (var feature of input.features) {

    let {
        referenceId: shstRefId,
        sideOfStreet: sideOfStreet,
        section: [shstLocationStart, shstLocationEnd],
        pp_type_code: TYPE_CODE
     //   pp_id: id_rpa,

    } = feature.properties
    
    shstLocationStart=Math.round(shstLocationStart);
    shstLocationEnd=Math.round(shstLocationEnd);

    marker = "signs";
    if(rpaCode[TYPE_CODE].regulations){
      var newTargetFeature = {
          ...feature,
          properties:{
            location:{
              shstRefId,
              sideOfStreet,
              shstLocationStart,
              shstLocationEnd,

            },
            regulations: rpaCode[TYPE_CODE].regulations
        }
      }
      geojson['features'].push(newTargetFeature);
    }
}
// console.log(geojson.features.length);
console.log(JSON.stringify(geojson))


