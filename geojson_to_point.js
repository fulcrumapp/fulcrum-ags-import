var getCentroid = require('turf-point-on-surface');

var geojsonToPoint = function (geojson) {
  var centroidFeature = getCentroid(geojson);
  return centroidFeature.geometry;
};

module.exports = geojsonToPoint;
