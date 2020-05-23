var rimraf = require('rimraf');
var fs = require('fs');
var once = require('once');

module.exports = function atomicCallbackFn(tempTarget, dest, callback) {
  if (typeof dest === 'function') {
    callback = dest;
    dest = null;
  }

  return once(function atomicCallback(err) {
    var args = arguments;
    if (err || !dest) return rimraf(tempTarget, callback.bind(null, err));
    rimraf(dest, function () {
      fs.rename(tempTarget, dest, function (err) {
        err ? callback(err) : callback.apply(null, args);
      });
    });
  });
};
