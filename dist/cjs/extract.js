"use strict";
require("./polyfills.js");
var once = require("once");
var eos = require("end-of-stream");
var createWriteStream = require("./createWriteStream.js");
module.exports = function extract(source, dest, options, callback) {
    if (typeof options === "string") options = {
        type: options
    };
    options = Object.assign({
        source: source
    }, options);
    var res = createWriteStream(dest, options);
    // path
    if (typeof source === "string") {
        callback = once(callback);
        res.on("error", callback);
        res.write(source, "utf8");
        return res.end(callback);
    }
    // stream
    return eos(source.pipe(res), callback);
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}