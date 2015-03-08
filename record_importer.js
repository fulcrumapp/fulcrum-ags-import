var crypto = require('crypto');

var async = require('async');
var AgsStream = require('ags-stream');

var utils = require('./utils');
var esriJsonToGeojson = require('./esrijson_to_geojson');
var geojsonToPoint = require('./geojson_to_point');

function hash (feature) {
  return crypto.createHash('md5').update(JSON.stringify(feature)).digest('hex')
}

function RecordImporter (form, serviceUrl, options, fulcrumClient) {
  var me = this;

  this.checkIfFinished = utils.bind(this.checkIfFinished, this);

  this.form = form;
  this.options = options;
  this.fulcrumClient = fulcrumClient;
  this.featureStatuses = {
    not_processed: {},
    complete: {},
    error: {}
  };

  this.agsStream = new AgsStream(serviceUrl, options);

  this.agsStream.on('data', function (data) {
    var tasks = data.map(function (feature) {
      var featureHash = hash(feature);

      me.featureStatuses.not_processed[featureHash] = feature;

      return function (callback) {
        me.storeFeature(feature, featureHash, callback);
      };
    });

    async.series(tasks);
  });

  this.agsStream.on('error', function (error) {
    me.callback(error);
  });

  this.agsStream.on('end', function (data) {
    me.monitorFinish();
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

RecordImporter.prototype.storeFeature = function (feature, featureHash, callback) {
  var me = this;
  var record = this.agsFeatureToRecord(feature);

  this.fulcrumClient.records.create(record, function (error, createdRecord) {
    if (error) {
      me.featureStatuses.error[featureHash] = feature;
    } else {
      me.featureStatuses.complete[featureHash] = feature;
    }

    delete me.featureStatuses.not_processed[featureHash];
    callback(null);
  });
};

RecordImporter.prototype.monitorFinish = function () {
  this.monitorFinishInterval = setInterval(this.checkIfFinished, 1000);
};

RecordImporter.prototype.checkIfFinished = function () {
  var numberRemaining = Object.keys(this.featureStatuses.not_processed).length;

  if (numberRemaining === 0) {
    clearInterval(this.monitorFinishInterval);
    var results = {
      createdCount: Object.keys(this.featureStatuses.complete).length,
      errorCount: Object.keys(this.featureStatuses.error).length,
      errors: this.featureStatuses.error
    };
    this.callback(null, results);
  }
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
