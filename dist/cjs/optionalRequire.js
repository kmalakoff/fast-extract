"use strict";
var requireOptional = require("require_optional");
module.exports = function optionalRequire(name) {
    try {
        var mod = require(name);
        if (mod) return mod;
    } catch (_err) {}
    try {
        var mod2 = requireOptional(name);
        if (mod2) return mod2;
    } catch (_err) {}
    return null;
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}