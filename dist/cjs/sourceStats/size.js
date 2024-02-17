"use strict";
var fs = require("fs");
module.exports = function getSize(source, options, callback) {
    // options
    if (options.size !== undefined) return callback(null, options.size);
    // path
    if (typeof source === "string") {
        return fs.stat(source, function(err, stats) {
            err ? callback(err) : callback(null, stats.size);
        });
    }
    // stream
    if (source) {
        if (source.headers && source.headers["content-length"]) return callback(null, +source.headers["content-length"]);
        if (source.size) return callback(null, source.size);
    }
    callback();
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}