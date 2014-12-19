#!/usr/bin/env node

var request = require('request');
var Fulcrum = require('fulcrum-app');
var _ = require('lodash');

var fieldMappings = require('./field_mappings');

var args = process.argv.slice(2);

if (args.length < 1) {
  console.log('A url must be passed.');
  return;
}

var serviceUrl = args[0];
var apiKey = process.env.FULCRUM_API_KEY;

var fulcrum = new Fulcrum({api_key: apiKey, url: 'http://localhost:3000/api/v2/'});

var baseElement = {
  disabled: false,
  hidden: false,
  required: false
};

var agsServiceCallback = function (error, response, body) {
  if (error) {
    console.log(error);
    return;
  }
  createForm(body);
};

agsServiceRequestOptions = {
  uri: serviceUrl + '?f=json',
  json: true
};

request(agsServiceRequestOptions, agsServiceCallback);

function createForm (agsServiceData) {
  var formPayload = {
    form: {
      name: agsServiceData.name,
      elements: agsFieldsToElements(agsServiceData.fields)
    }
  };

  var fulcrumFormCreateCallback = function (error, form) {
    if (error) {
      console.log(error);
      return;
    }
    console.log('Form created: ' + JSON.stringify(form));
  };

  fulcrum.forms.create(formPayload, fulcrumFormCreateCallback);
}

function agsFieldsToElements(agsFields) {
  var fulcrumElements = [];
  var baseElement = {
    disabled: false,
    hidden: false,
    required: false
  };

  agsFields.forEach(function(agsField) {
    if (agsField.type in fieldMappings) {
      var element = _.merge({}, fieldMappings[agsField.type]);
      element.key = normalizeFieldKey(agsField.name);
      element.data_name = normalizeFieldKey(agsField.name);
      element.label = agsField.alias || agsField.name;
      fulcrumElements.push(_.merge(element, baseElement));
    } else {
      console.log('AGS field "' + agsField.name + '"" has unknown type "' + agsField.type + '" ... skipping.');
    }
  });
  return fulcrumElements;
}

function normalizeFieldKey(fieldKey) {
  return fieldKey.toLowerCase();
}
