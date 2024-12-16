"use strict";
var requireOptional = require('require_optional');
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
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }