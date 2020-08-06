import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import {OSM as OSMSource, XYZ as XYZSource} from 'ol/source.js';
import {fromLonLat} from 'ol/proj';
import {ComparisonTools as ComparisonToolsControl} from '../../src/control.js'
import {HistogramMatching as HistogramMatchingControl} from '../../src/control.js'


var mapMinZoom = 8;
var mapMaxZoom = 20;
var mapCenter = [35.519191, 33.900884];
var defaultCenter = fromLonLat(mapCenter);

var layer1 = new TileLayer({
  source: new XYZSource({
      projection: 'EPSG:3857',
      attributions: 'Tiles © Maxar 2020',
      url: 'https://labs.webgeodatavore.com/partage/10300500A5F95600/{z}/{x}/{-y}.png',
      minZoom: mapMinZoom,
      maxZoom: mapMaxZoom
  })
});

var layer2 = new TileLayer({
  source: new XYZSource({
      projection: 'EPSG:3857',
      attributions: 'Tiles © Maxar 2020',
      url: 'https://labs.webgeodatavore.com/partage/104001005EBCEB00/{z}/{x}/{-y}.png',
      minZoom: mapMinZoom,
      maxZoom: mapMaxZoom
  })
});

/* layer order is important here */
var olMap = new Map({
  target: window.document.getElementById('map'),
  layers: [ layer1, layer2 ],
  view: new View({
    center: defaultCenter,
    zoom: 16
  })
});

var ccontrol = new ComparisonToolsControl({
  leftLayer: layer1,
  rightLayer: layer2
});

var hcontrol = new HistogramMatchingControl({
  layer1: layer1,
  layer2: layer2
});

olMap.addControl(ccontrol);
olMap.addControl(hcontrol);
ccontrol.setDisplayMode('doubleMap');



window.changeLeftLayer = function() {
  var selectedLayer = document.getElementById("leftLayerSelect").value;
  var newLayer;
  if(selectedLayer == "osm") {
    newLayer = new TileLayer({
      source: new OSMSource()
    });
  } else if(selectedLayer == "mapbox") {
    newLayer = new TileLayer({
      source: new TileJSONSource({
        url: 'https://api.tiles.mapbox.com/v3/mapbox.natural-earth-hypso-bathy.json?secure',
        crossOrigin: 'anonymous'
      })
    });
  }
  olMap.getLayers().setAt(0, newLayer);
  ccontrol.setLeftLayer(newLayer);
}


window.changeRightLayer = function() {
  var selectedLayer = document.getElementById("rightLayerSelect").value;
  var newLayer;
  if(selectedLayer == "osm") {
    newLayer = new TileLayer({
      source: new OSMSource()
    });
  } else if(selectedLayer == "mapbox") {
    newLayer = new TileLayer({
      source: new TileJSONSource({
        url: 'https://api.tiles.mapbox.com/v3/mapbox.natural-earth-hypso-bathy.json?secure',
        crossOrigin: 'anonymous'
      })
    });
  }
  olMap.getLayers().setAt(1, newLayer);
  ccontrol.setRightLayer(newLayer);
}
