#!/usr/bin/env node

var minimist = require('minimist');
var Fulcrum = require('fulcrum-app');

var FormCreator = require('./form_creator');
var RecordImporter = require('./record_importer');

var argv = minimist(process.argv.slice(2));

if (argv._.length < 1) {
  console.log('A url must be passed.');
  return;
}

var skip_fields = argv['skip-fields'];
if (skip_fields) {
  skip_fields = skip_fields.split(',');
}

var where = argv.where;
var serviceUrl = argv._[0];
var apiKey = argv['api-key'] || process.env.FULCRUM_API_KEY;
var chunkSize = argv['chunk-size'] || 50;

if (!apiKey) {
  console.log('An API key must be present either as a \'--api-key\' argument or as a \'FULCRUM_API_KEY\' environment variable.');
  return;
}

var options = {
  skip_fields: skip_fields,
  where: where,
  chunkSize: chunkSize
};

var fulcrumClient = new Fulcrum({api_key: apiKey});

var fromCreatorCallback = function (error, form) {
  if (error) {
    console.log('Error creating form: ' + error);
    return;
  }
  console.log('Form created: ' + form.form.name);
  importRecords(form);
};
var formCreator = new FormCreator(serviceUrl, options, fulcrumClient);

formCreator.create(fromCreatorCallback);

function importRecords (form) {
  var recordImporterCallback = function (error, results) {
    if (error) {
      console.log('Error importing records: ' + error);
      return;
    }
    console.log('Records created: ' + JSON.stringify(results));
  };
  var recordImporter = new RecordImporter(form, serviceUrl, options, fulcrumClient);
  recordImporter.import(recordImporterCallback);
}
