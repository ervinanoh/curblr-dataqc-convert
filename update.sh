#!/bin/bash

echo -n "Retrieve online data... "
wget -N -P data https://www.donneesquebec.ca/recherche/fr/dataset/9c11aab8-419c-4a7e-8bdc-95b5395a9f32/resource/27480cd1-ab19-47fe-a93b-9d526a0eb1e3/download/vdq-panneauxstationnement.geojson
cp ~/curblr-datamtl-convert/rpa/signalisation-codification-rpa.json /home/sahmadpouribagha/curblr-datamtl-convert/data
echo "done"

#To be done instead of manual file
#echo -n "create rpa... "
#node vdq_to_rpa.js json > data/signalisation-codification-rpa.json
#echo "done"


echo -n "create regulations... "
node rpa_to_regulations.js json > data/signalisation-codification-rpa_withRegulation.json
echo "done"



rm data/mtl-subset*
echo -n "create subset... "
node subset.js > data/mtl-subset.geojson
echo "done"

shst match data/mtl-subset.geojson --search-radius=15 --offset-line=10 --snap-side-of-street --buffer-points

echo -n "transform to segment... "
node mtl_to_segment.js > data/mtl-subset-segment.geojson
echo "done"

shst match data/mtl-subset-segment.geojson --join-points --join-points-match-fields=TYPE_CODE \
    --search-radius=15 --snap-intersections --snap-intersections-radius=10 \
    --trim-intersections-radius=5 --buffer-merge-group-fields=ID \
    --buffer-points \
    #--direction-field=direction --two-way-value=two --one-way-against-direction-value=against --one-way-with-direction-value=one


echo -n "generate curblr... "
node segment_to_curblr.js > data/mtl-subset-segment.curblr.json
echo "done"

#node stats.js > data/mtl-subset-unmanaged.geojson

date
