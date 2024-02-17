"use strict";
var path = require("path");
module.exports = function extname(fullPath) {
    var basename = path.basename(fullPath);
    var index = basename.indexOf(".");
    return ~index ? basename.slice(index) : "";
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}