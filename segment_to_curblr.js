// curblrizes a geojson output from sharedstreets-js

const fs = require('fs');
const path = require('path');

const inputGeojson = fs.readFileSync('data/mtl-subset-segment.joined.geojson');
const input = JSON.parse(inputGeojson);
const rpaCodeJson = fs.readFileSync('data/signalisation-codification-rpa_withRegulation.json');
let rpaCode = JSON.parse(rpaCodeJson).reduce((acc,val)=>{acc[val.PANNEAU_ID_RPA]=val; return acc;},{});
const agregateRpaCodeJson = fs.readFileSync('data/agregate-pannonceau-rpa.json');
const agregateRpaCode = JSON.parse(agregateRpaCodeJson);

rpaCode = {...rpaCode, ...agregateRpaCode}

var geojson = {};
geojson['type'] = 'FeatureCollection';
geojson['features'] = [];

for (var feature of input.features) {

    let {
        referenceId: shstRefId,
        sideOfStreet: sideOfStreet,
        section: [shstLocationStart, shstLocationEnd],
        pp_code_rpa: code_rpa,
        pp_panneau_id_rpa: id_rpa,
        pp_panneau_id_pan: derivedFrom
    } = feature.properties
    
    shstLocationStart=Math.round(shstLocationStart);
    shstLocationEnd=Math.round(shstLocationEnd);

    marker = "signs";
    if(rpaCode[id_rpa].regulations){
      var newTargetFeature = {
          ...feature,
          properties:{
            location:{
              shstRefId,
              sideOfStreet,
              shstLocationStart,
              shstLocationEnd,
              derivedFrom
            },
            regulations: rpaCode[id_rpa].regulations
        }
      }
      geojson['features'].push(newTargetFeature);
    }
}
// console.log(geojson.features.length);
console.log(JSON.stringify(geojson))


