// curblrizes a geojson output from sharedstreets-js

const fs = require('fs');
const path = require('path');

const inputGeojson = fs.readFileSync('data/vdq-panneauxstationnement.geojson');
const input = JSON.parse(inputGeojson);

//var geojson = {"crs":input.crs};
var geojson={};
geojson['type'] = 'FeatureCollection';

function zoneFilter (feature, lon,lat){
    return Math.min(...lon)<feature.geometry.coordinates[0]
        && Math.max(...lon)>feature.geometry.coordinates[0]
        && Math.min(...lat)<feature.geometry.coordinates[1]
        && Math.max(...lat)>feature.geometry.coordinates[1]
}



geojson['features'] = input.features.filter(feature=>zoneFilter(feature,[-71.214407,-71.204170],[46.815036,46.807455]));
//geojson['features'] = input.features.filter(feature=>zoneFilter(feature,[-71.244356,-71.231633],[46.814231,46.811891]));
//geojson['features'] = input.features.filter(feature=>zoneFilter(feature,[-71.278270,-71.238651],[46.852654,46.851985]));




geojson['features'] = geojson.features.map(feature=>{
  //  feature.properties.title = feature.properties.PANNEAU_ID_PAN;
    feature.properties.description = `${feature.properties.ID} --- ${feature.properties.DESCRIPTION}`;
     // --- ${feature.properties.FLECHE_PAN}`;
    feature.properties.original_geometry=feature.geometry;
    return feature;
});

console.error(geojson.features.length);
console.log(JSON.stringify(geojson, null, 2))


