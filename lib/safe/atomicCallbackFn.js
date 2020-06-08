var rimraf = require('rimraf');
var once = require('once');
var cleanExit = require('./cleanExit');

module.exports = function atomicCallbackFn(dest, isTemporary, callback) {
  if (typeof isTemporary === 'function') {
    callback = isTemporary;
    isTemporary = false;
  }

  cleanExit.add(dest);
  return once(function atomicCallback(err) {
    cleanExit.remove(dest);
    if (err || isTemporary) {
      return rimraf(dest, function () {
        callback(err);
      });
    }
    return callback.apply(null, arguments);
  });
};
