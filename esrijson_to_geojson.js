var terraformer = require('terraformer-arcgis-parser');

var esriJsonToGeojson = function (esriJson) {
  var geojson = terraformer.parse(esriJson);
  return geojson;
};

module.exports = esriJsonToGeojson;
