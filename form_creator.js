var request = require('request');
var _ = require('lodash');

var fieldMappings = require('./field_mappings');
var utils = require('./utils');

function agsFieldsToElements (agsFields) {
  var fulcrumElements = [];
  var baseElement = {
    disabled: false,
    hidden: false,
    required: false
  };

  agsFields.forEach(function(agsField) {
    if (agsField.type in fieldMappings) {
      var element = _.merge({}, fieldMappings[agsField.type]);
      element.key = utils.normalizeFieldKey(agsField.name);
      element.data_name = utils.normalizeFieldKey(agsField.name);
      element.label = agsField.alias || agsField.name;
      fulcrumElements.push(_.merge(element, baseElement));
    } else {
      console.log('AGS field "' + agsField.name + '"" has unknown type "' + agsField.type + '" ... skipping.');
    }
  });
  return fulcrumElements;
}

function FormCreator(serviceUrl, fulcrumClient) {
  this.serviceUrl = serviceUrl;
  this.fulcrumClient = fulcrumClient;

  this.agsServiceCallback = utils.bind(this.agsServiceCallback, this);
  this.fulcrumFormCreateCallback = utils.bind(this.fulcrumFormCreateCallback, this);

  this.baseElement = {
    disabled: false,
    hidden: false,
    required: false
  };
}

FormCreator.prototype.create = function (callback) {
  this.callback = callback;
  this.getAgsService();
};

FormCreator.prototype.agsServiceCallback = function (error, response, body) {
  if (error) {
    this.callback(error);
  } else {
    this.createFulcrumForm(body);
  }
};

FormCreator.prototype.getAgsService = function () {
  agsServiceRequestOptions = {
    uri: this.serviceUrl,
    qs: {
      f: 'json'
    },
    json: true
  };

  request(agsServiceRequestOptions, this.agsServiceCallback);
};

FormCreator.prototype.fulcrumFormCreateCallback = function (error, form) {
  if (error) {
    this.callback(error);
  } else {
    this.callback(null, form);
  }
};

FormCreator.prototype.createFulcrumForm = function (agsServiceData) {
  var formPayload = {
    form: {
      name: agsServiceData.name,
      elements: agsFieldsToElements(agsServiceData.fields)
    }
  };

  this.fulcrumClient.forms.create(formPayload, this.fulcrumFormCreateCallback);
};

module.exports = FormCreator;
