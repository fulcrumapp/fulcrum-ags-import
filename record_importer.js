var async = require('async');
var request = require('request');
var _ = require('lodash');
var AgsStream = require('ags-stream')

var utils = require('./utils');
var esriJsonToGeojson = require('./esrijson_to_geojson');
var geojsonToPoint = require('./geojson_to_point');

function RecordImporter (form, serviceUrl, options, fulcrumClient) {
  var me = this;

  this.form = form;
  this.options = options;
  this.fulcrumClient = fulcrumClient;
  this.chunkSize = options.chunkSize;

  this.agsStream = new AgsStream(serviceUrl, options);

  this.agsStream.on('data', function (data) {
    data.forEach(function (feature) {
      me.storeFeature(feature);
    })
  });

  this.agsStream.on('error', function (error) {
    me.callback(error);
  });

  this.agsStream.on('end', function (data) {
    me.callback(null);
  });
}

RecordImporter.prototype.import = function (callback) {
  this.callback = callback;
  this.agsStream.read();
};

RecordImporter.prototype.normalizeAttribute = function (key, value) {
  var fieldType = this.form.agsFields[key];
  if (value === null) {
    return null;
  } else {
    if (fieldType === 'esriFieldTypeDate') {
      var val = value;
      try {
        var date = new Date(value);
        val = date.toISOString().split('T')[0];
      } catch (e) {
        console.log('Could not convert date: ' + value);
        val = value;
      }
      return val.toString();
    } else {
      return value.toString();
    }
  }
};

RecordImporter.prototype.storeFeature = function (feature) {
  var me = this;
  var record = this.agsFeatureToRecord(feature);

  this.fulcrumClient.records.create(record, function (error, createdRecord) {
    if (error) {
      me.callback(error);
    }
  });
};

RecordImporter.prototype.agsFeatureToRecord = function (agsRecord) {
  var form_values = {};

  var geojson = esriJsonToGeojson(agsRecord.geometry);
  var point = geojsonToPoint(geojson);

  for (var prop in agsRecord.attributes) {
    if (prop) {
      if (this.options.skip_fields && this.options.skip_fields.indexOf(prop) > -1) {

      } else {
        form_values[utils.normalizeFieldKey(prop)] = this.normalizeAttribute(prop, agsRecord.attributes[prop]);
      }
    }
  }

  var record = {
    record: {
      form_id: this.form.form.id,
      latitude: point.coordinates[1],
      longitude: point.coordinates[0],
      form_values: form_values
    }
  };
  return record;
};

module.exports = RecordImporter;
