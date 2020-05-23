var rimraf = require('rimraf');
var onExit = require('signal-exit');

var fullPaths = [];

onExit(function (code, signal) {
  while (fullPaths.length) {
    var fullPath = fullPaths.pop();
    try {
      rimraf.sync(fullPath);
    } catch (err) {}
  }
});

module.exports.add = function add(fullPath) {
  fullPaths.push(fullPath);
};

module.exports.remove = function remove(fullPath) {
  var index = fullPaths.indexOf(fullPath);
  if (index >= 0) fullPaths.splice(index, 1);
};
