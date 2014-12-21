var async = require('async');
var request = require('request');
var _ = require('lodash');

var utils = require('./utils');

function normalizeAttribute (key, value) {
  if (value === null) {
    return null;
  } else {
    return value.toString();
  }
}

function RecordImporter (form, serviceUrl, fulcrumClient) {
  this.form = form;
  this.serviceUrl = serviceUrl;
  this.fulcrumClient = fulcrumClient;
  this.chunkSize = 50;
  this.parallelLimit = 20;

  this.objectIdsCallback = utils.bind(this.objectIdsCallback, this);
  this.processChunksCallback = utils.bind(this.processChunksCallback, this);
}

RecordImporter.prototype.import = function (callback) {
  this.callback = callback;
  this.getObjectIds();
};

RecordImporter.prototype.objectIdsCallback = function (error, response, body) {
  var chunkSize = this.chunkSize;
  if (error) {
    this.callback(error);
  } else {
    var objectIds = body.objectIds;
    console.log('Processing ' + objectIds.length + ' features ...');
    var chunks = _.chain(objectIds).groupBy(function(element, index){
      return Math.floor(index / chunkSize);
    }).toArray().value();
    this.objectIdChunks = chunks;
    this.processChunks();
  }
};

RecordImporter.prototype.getObjectIds = function () {
  objectIdsRequestOptions = {
    uri: this.serviceUrl + '/query',
    qs: {
      returnIdsOnly: 'true',
      f: 'json',
      where: '1=1'
      //where: 'OBJECTID<=600'
    },
    json: true
  };

  request(objectIdsRequestOptions, this.objectIdsCallback);
};

RecordImporter.prototype.processChunks = function () {
  var me = this;

  var tasks = this.objectIdChunks.map(function (chunk) {
    return function(callback) {
      me.processChunk(chunk, callback);
    };
  });

  async.series(tasks, this.processChunksCallback);
};

RecordImporter.prototype.processChunk = function (chunk, callback) {
  var me = this;
  console.log('Processing chunk - size: ' + chunk.length + ', objectids: (' + chunk[0] + ' - ' + chunk[chunk.length - 1] + ').');
  var tasks = chunk.map(function (objectId) {
    return function (_callback) {
      me.fetchAndStoreRecord(objectId, _callback);
    };
  });

  async.parallelLimit(tasks, this.parallelLimit, function (error, results) {
    if (error) {
      callback(error);
    } else {
      callback(null, results);
    }
  });
};

RecordImporter.prototype.fetchAndStoreRecord = function (objectId, callback) {
  var me = this;

  var featureRequestOptions = {
    uri: this.serviceUrl + '/query',
    qs: {
      objectIds: objectId,
      outFields: '*',
      returnGeometry: 'true',
      f: 'json',
      outSR: '4326'
    },
    json: true
  };

  request(featureRequestOptions, function (error, response, body) {
    if (error) {
      callback(error);
    } else {
      var agsFeature = body.features[0];
      var record = me.agsFeatureToRecord(agsFeature);
      me.fulcrumClient.records.create(record, function (error, createdRecord) {
        if (error) {
          callback(error);
        } else {
          callback(null, 1);
        }
      });
    }
  });
};

RecordImporter.prototype.processChunksCallback = function (error, results) {
  if (error) {
    this.callback(error);
  } else {
    //var count = _.reduce(results, function (memo, num) {return memo + num;}, 0);
    //console.log('Chunks complete, count: ' + count);
    console.log('Chunks complete: ' + results);
  }
};

RecordImporter.prototype.agsFeatureToRecord = function (agsRecord) {
  var form_values = {};

  for (var prop in agsRecord.attributes) {
    if (prop) {
      form_values[utils.normalizeFieldKey(prop)] = normalizeAttribute(prop, agsRecord.attributes[prop]);
    }
  }

  var record = {
    record: {
      form_id: this.form.form.id,
      latitude: agsRecord.geometry.y,
      longitude: agsRecord.geometry.x,
      form_values: form_values
    }
  };
  return record;
};

module.exports = RecordImporter;
