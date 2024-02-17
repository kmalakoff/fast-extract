"use strict";
var rimraf = require("rimraf");
var Queue = require("queue-cb");
module.exports = function rimrafAll(fullPaths, callback) {
    if (!fullPaths.length) return callback();
    var queue = new Queue(1);
    for(var index = 0; index < fullPaths.length; index++){
        (function(fullPath) {
            queue.defer(function(callback) {
                rimraf(fullPath, function(err) {
                    err && err.code !== "ENOENT" ? callback(err) : callback();
                });
            });
        })(fullPaths[index]);
    }
    queue.await(callback);
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}