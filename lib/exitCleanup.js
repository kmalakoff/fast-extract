var rimraf = require('rimraf');
var onExit = require('signal-exit');

var fullPaths = [];

onExit(function exist(code, signal) {
  while (fullPaths.length) {
    try {
      rimraf.sync(fullPaths.pop());
    } catch (err) {}
  }
});

module.exports.add = function add(fullPath) {
  fullPaths.push(fullPath);
};

module.exports.remove = function remove(fullPath) {
  var index = fullPaths.indexOf(fullPath);
  if (!~index) console.log('Path does not exist for remove: ' + fullPath);
  fullPaths.splice(index, 1);
};
