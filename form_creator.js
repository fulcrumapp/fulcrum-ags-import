var request = require('request');
var _ = require('lodash');

var fieldMappings = require('./field_mappings');
var utils = require('./utils');

function FormCreator(serviceUrl, options, fulcrumClient) {
  this.serviceUrl = serviceUrl;
  this.options = options;
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
    var agsFields = {};
    body.fields.forEach(function (agsField) {
      agsFields[agsField.name] = agsField.type;
    });
    this.agsFields = agsFields;
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
    form.agsFields = this.agsFields;
    this.callback(null, form);
  }
};

FormCreator.prototype.createFulcrumForm = function (agsServiceData) {
  var elements = this.agsFieldsToElements(agsServiceData.fields);
  var formPayload = {
    form: {
      name: agsServiceData.name,
      record_title_key: elements[0].key,
      elements: elements
    }
  };

  this.fulcrumClient.forms.create(formPayload, this.fulcrumFormCreateCallback);
};

FormCreator.prototype.agsFieldsToElements = function (agsFields) {
  var me = this;
  var fulcrumElements = [];
  var baseElement = {
    disabled: false,
    hidden: false,
    required: false
  };

  agsFields.forEach(function(agsField) {
    if (agsField.type in fieldMappings) {
      if (me.options.skip_fields && me.options.skip_fields.indexOf(agsField.name) > -1) {
        console.log('Skipping field: ' + agsField.name);
      } else {
        var element = _.merge({}, fieldMappings[agsField.type]);
        element.key = utils.normalizeFieldKey(agsField.name);
        element.data_name = utils.normalizeFieldKey(agsField.name);
        element.label = agsField.alias || agsField.name;
        fulcrumElements.push(_.merge(element, baseElement));
      }
    } else {
      console.log('AGS field "' + agsField.name + '"" has unknown type "' + agsField.type + '" ... skipping.');
    }
  });
  return fulcrumElements;
};

module.exports = FormCreator;
