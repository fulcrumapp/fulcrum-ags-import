var field_mappings = {
  'esriFieldTypeString'       : {type: 'TextField'},
  'esriFieldTypeOID'          : {type: 'TextField'},
  'esriFieldTypeDate'         : {type: 'DateTimeField'},
  'esriFieldTypeDouble'       : {type: 'TextField', numeric: true},
  'esriFieldTypeSingle'       : {type: 'TextField', numeric: true},
  'esriFieldTypeInteger'      : {type: 'TextField', numeric: true, format: 'integer'},
  'esriFieldTypeSmallInteger' : {type: 'TextField', numeric: true, format: 'integer'},
};

module.exports = field_mappings;
