#!/usr/bin/env node

var Fulcrum = require('fulcrum-app');

var FormCreator = require('./form_creator');
var RecordImporter = require('./record_importer');

var args = process.argv.slice(2);

if (args.length < 1) {
  console.log('A url must be passed.');
  return;
}

var serviceUrl = args[0];
var apiKey = process.env.FULCRUM_API_KEY;

var fulcrumClient = new Fulcrum({api_key: apiKey, url: 'http://localhost:3000/api/v2/'});

var fromCreatorCallback = function (error, form) {
  if (error) {
    console.log('Error creating form: ' + error);
    return;
  }
  importRecords(form);
};
var formCreator = new FormCreator(serviceUrl, fulcrumClient);

formCreator.create(fromCreatorCallback);

function importRecords (form) {
  var recordImporterCallback = function (error, results) {
    if (error) {
      console.log('Error importing records: ' + error);
      return;
    }
    console.log('Records created: ' + JSON.stringify(results));
  };
  var recordImporter = new RecordImporter(form, serviceUrl, fulcrumClient);
  recordImporter.import(recordImporterCallback);
}
