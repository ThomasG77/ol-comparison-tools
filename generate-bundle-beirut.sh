# wget https://opendata.digitalglobe.com/events/beirut-explosion/post-event/2020-08-05/102001009BCC9D00/102001009BCC9D00.tif
# wget https://opendata.digitalglobe.com/events/beirut-explosion/post-event/2020-08-05/10300500A6F8AA00/10300500A6F8AA00.tif
# wget https://opendata.digitalglobe.com/events/beirut-explosion/post-event/2020-08-05/104001005EBCEB00/104001005EBCEB00.tif
# gdal_translate -of VRT -projwin_srs EPSG:4326 -projwin 35.5 33.91 35.55 33.89 104001005EBCEB00.tif output-104001005EBCEB00.vrt
# gdal_translate -of VRT -projwin_srs EPSG:4326 -projwin 35.5 33.91 35.55 33.89 102001009BCC9D00.tif output-102001009BCC9D00.vrt
# gdal_translate -of VRT -projwin_srs EPSG:4326 -projwin 35.5 33.91 35.55 33.89 10300500A6F8AA00.tif output-10300500A6F8AA00.vrt
# gdal2tiles.py --zoom=8-18 --copyright="Maxar 2020" output-104001005EBCEB00.vrt 104001005EBCEB00/
# gdal2tiles.py --zoom=19-20 --copyright="Maxar 2020" output-104001005EBCEB00.vrt 104001005EBCEB00/
# gdal2tiles.py --zoom=8-18 --copyright="Maxar 2020" output-102001009BCC9D00.vrt 102001009BCC9D00/
# gdal2tiles.py --zoom=8-18 --copyright="Maxar 2020" output-10300500A6F8AA00.vrt 10300500A6F8AA00/

# wget https://opendata.digitalglobe.com/events/beirut-explosion/pre-event/2020-07-31/10300500A5F95600/10300500A5F95600.tif
# gdal_translate -of VRT -projwin_srs EPSG:4326 -projwin 35.5 33.91 35.55 33.89 10300500A5F95600.tif output-10300500A5F95600.vrt
# gdal2tiles.py --zoom=8-18 --copyright="Maxar 2020" output-10300500A5F95600.vrt 10300500A5F95600/
# gdal2tiles.py --zoom=19-20 --copyright="Maxar 2020" output-10300500A5F95600.vrt 10300500A5F95600/

./node_modules/.bin/gulp build-examples
mkdir beirut
cp examples/package/dist/* beirut/
cp node_modules/jquery/dist/jquery.js beirut/
cp node_modules/ol/ol.css beirut/
cp node_modules/ol-ext/dist/ol-ext.css beirut/
cp examples/package/index.html beirut/
cp dist/* beirut
sed -i 's#../../../dist/comparisontools.css#comparisontools.css#g' beirut/example.css
sed -i 's#../../../node_modules/ol/ol.css#ol.css#g' beirut/example.css
sed -i 's#../../../node_modules/ol-ext/dist/ol-ext.css#ol-ext.css#g' beirut/example.css
scp -r beirut new_dedibox:/home/thomasg/partage/
