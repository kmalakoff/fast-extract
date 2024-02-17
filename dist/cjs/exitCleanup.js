"use strict";
var rimraf = require("rimraf");
var onExit = require("signal-exit");
var fullPaths = [];
onExit(function exist(_code, _signal) {
    while(fullPaths.length){
        try {
            rimraf.sync(fullPaths.pop());
        } catch (_err) {}
    }
});
module.exports.add = function add(fullPath) {
    fullPaths.push(fullPath);
};
module.exports.remove = function remove(fullPath) {
    var index = fullPaths.indexOf(fullPath);
    if (index < 0) console.log("Path does not exist for remove: ".concat(fullPath));
    fullPaths.splice(index, 1);
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}