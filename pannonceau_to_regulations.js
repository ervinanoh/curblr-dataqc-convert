
let jsonOutput="false";
if(process.argv[2]==="jsonmtl"){
    jsonOutput="jsonmtl";
}
if(process.argv[2]==="jsonpan"){
    jsonOutput="jsonpan";
}

function debug(...param){
    if(jsonOutput=="false" || true){
        console.error(...param);
    }
}

const fs = require('fs');

const mtlData = fs.readFileSync('data/vdq-panneauxstationnement.geojson');
const mtlDataJson = JSON.parse(mtlData);
const mtlFeatur = mtlDataJson.features;

const rpaCodeJson = fs.readFileSync('data/signalisation-codification-rpa_withRegulation.json');
const rpaCode = JSON.parse(rpaCodeJson).reduce((acc,val)=>{acc[val.ID]=val; return acc;},{});

mtlPot = mtlFeatur.reduce((acc,val)=>{
    acc[val.properties.ID]=acc[val.properties.ID]?acc[val.properties.ID]:[];
    acc[val.properties.ID].push(val);
    return acc;
},{});
mtlPotWithPannonceau = Object.values(mtlPot)
    .reduce((acc,val)=>{
        val.sort((a, b) => b.properties.ID - a.properties.ID); // reverse order
        let pannonceau=false;
        let fakeRPA=[];
        let pannelsRPA=[];
        let pannelsfull=[];
        val.forEach(pan => {
            if(rpaCode[pan.properties.ID]){
                if(pan.properties.DESCRIPTION=="STAT-PANNONC."){
                    pannonceau=true
                    pannelsRPA.unshift({ID: pan.properties.ID,
                        DESCRIPTION: pan.properties.DESCRIPTION,
            //            DESCRIPTION_CAT: pan.properties.DESCRIPTION_CAT,
                        TYPE_CODE: pan.properties.TYPE_CODE,
                        RULES: rpaCode[pan.properties.ID].regulations})
                    pannelsfull.unshift(JSON.parse(JSON.stringify(pan)))
                } else {

                    let newpannel=null;
                    if(pannonceau){
                        fakeRPA.push(pan.properties.ID);
                        pannelsRPA.unshift({ID: pan.properties.ID,
                            DESCRIPTION: pan.properties.DESCRIPTION,
                         //   DESCRIPTION_CAT: pan.properties.DESCRIPTION,
                            TYPE_CODE: pan.properties.TYPE_CODE,
                            RULES: rpaCode[pan.properties.ID].regulations||[]})
                        agregateID_RPA=pannelsRPA.map(val=>val.ID).sort().join("_");
                        agregateCODE_RPA=pannelsRPA.map(val=>val.TYPE_CODE).sort().join("_");
                        acc.rpa[agregateID_RPA]={   agregateID_RPA: agregateID_RPA,
                            unmmanaged: pannelsRPA,
                            managed: []};
                        newpannel=JSON.parse(JSON.stringify(pan));
                        newpannel.properties.ID=agregateID_RPA;
                        newpannel.properties.TYPE_CODE=agregateCODE_RPA;
                        newpannel.properties.agregate=pannelsfull;
                    } else {
                        newpannel=JSON.parse(JSON.stringify(pan));
                    }
                    acc.all.push(newpannel);

                    pannonceau=false;
                    fakeRPA=[];
                    pannelsRPA=[];
                    pannelsfull=[];
                }
            }
        });

        return acc;
    },{all:[],rpa:{}});

function updateRule(id_rpa,fonc){
    Object.values(mtlPotWithPannonceau.rpa).filter(elem=>elem.unmmanaged.some(val=>val.ID==id_rpa)).forEach(elem=>{
        elem.unmmanaged=elem.unmmanaged.filter(val=>{if(val.ID==id_rpa){pannonceau=val;return false} return true; });
        elem.managed.push(pannonceau);
        if(fonc){
            fonc(elem, pannonceau);
        }
    })
}
function updateRules(id_rpa,fonc){
    id_rpa.forEach(elem=>updateRule(elem,fonc));
}

Object.values(mtlPotWithPannonceau.rpa).forEach(elem=>{
    pannonceau=elem.unmmanaged.shift();
    elem.managed.push(pannonceau);
    elem.tempRules=JSON.parse(JSON.stringify(pannonceau.RULES));
})

//PANONCEAU EXCEPTE PERIODE INTERDITE
updateRule(1514,(elem, pannonceau)=>{
    elem.tempRules.forEach(rule=>rule.priority++);
});

//1512 PANONCEAU DEBAR. SEULEMENT
//1516 PANONCEAU LIVRAISON SEULEMENT
//16225 EXCEPTE  DEBARCADERE
//9095 PANONCEAU RESERVE GARDERIE
updateRules([1512, 1516, 16225, 9095],(elem, pannonceau)=>{
    elem.tempRules.slice(-1)[0].rule.activity="loading";
});

//9094 PANONCEAU EXCEPTE DEBARCADERE GARDERIE 15 MINUTES
updateRule(9094,(elem, pannonceau)=>{
    regulation=elem.tempRules.slice(-1)[0];
    regulation.rule.activity="loading";
    regulation.rule.maxStay=15;
});

//1482 PANONCEAU DEBARCADERE RESERVE HANDICAPE
updateRule(1482,(elem, pannonceau)=>{
    regulation=elem.tempRules.slice(-1)[0];
    regulation.rule.activity="loading";
    regulation.UserClasses={classe:["handicap"]};
});

// pannonceau timespan suplementaire
Object.values(mtlPotWithPannonceau.rpa).filter(elem=>elem.unmmanaged.some(val=>!!val.RULES && val.RULES.length>0 && val.RULES.some(rule=>!rule.priority && !!rule.timeSpans && rule.timeSpans.length>0))).forEach(elem=>{
    elem.unmmanaged=elem.unmmanaged.filter(val=>{
        if(!!val.RULES && val.RULES.length>0 && val.RULES.some(rule=>!rule.priority && !!rule.timeSpans && rule.timeSpans.length>0)){
            pannonceau=val;
            elem.managed.push(pannonceau);

            regulations=elem.tempRules.slice(-1)[0];
            regulations.timeSpans.forEach(ts=>{ts={...ts, ...pannonceau.RULES[0].timeSpans}})

            return false
        }
        return true;
    });
})

// PANONCEAU ZONE DE REMORQUAGE
updateRules([1528,16303])

Object.values(mtlPotWithPannonceau.rpa).forEach(elem=>{
    if(elem.unmmanaged.length==0){
        elem.regulations=elem.tempRules;
        elem.tempRules=null
    //} else {
        // elem.unmmanaged.forEach(unman=>debug(`${unman.PANNEAU_ID_RPA} ${unman.DESCRIPTION_RPA}`));
    }
})

/*debug("all",Object.values(mtlPotWithPannonceau.rpa).length)
debug(9488,Object.values(mtlPotWithPannonceau.rpa).filter(elem=>elem.some(val=>val.PANNEAU_ID_RPA==9488)).length)
debug(1512,Object.values(mtlPotWithPannonceau.rpa).filter(elem=>elem.some(val=>val.PANNEAU_ID_RPA==1512)).length)
debug(1514,Object.values(mtlPotWithPannonceau.rpa).filter(elem=>elem.some(val=>val.PANNEAU_ID_RPA==1514)).length)*/
if(jsonOutput=="jsonmtl"){
    var geojson = {"crs":mtlDataJson.crs};
    geojson['type'] = 'FeatureCollection';
    geojson['features'] = mtlPotWithPannonceau.all
    console.log(JSON.stringify(geojson, null, 2));
}
if(jsonOutput=="jsonpan"){
    console.log(JSON.stringify(mtlPotWithPannonceau.rpa, null, 2));
}
debug(Object.values(mtlPotWithPannonceau.rpa).filter(elem=>elem.unmmanaged.length>0).length)