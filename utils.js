var bind = function (fn, me) {
  return function(){
    return fn.apply(me, arguments);
  };
};

var normalizeFieldKey = function (fieldKey) {
  return fieldKey.toLowerCase();
};

module.exports = {
  bind: bind,
  normalizeFieldKey: normalizeFieldKey
};
