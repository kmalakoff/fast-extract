"use strict";
var fs = require("fs");
module.exports = function writeTruncateFile(fullPath, callback) {
    fs.open(fullPath, "w", function(err, fd) {
        if (err) return callback(err);
        fs.close(fd, callback);
    });
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}