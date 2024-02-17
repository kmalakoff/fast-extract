"use strict";
var path = require("path");
var contentDisposition = require("content-disposition");
// biome-ignore lint/suspicious/noControlCharactersInRegex: <explanation>
var POSIX = /[<>:"\\/\\|?*\x00-\x1F]/g;
var WINDOWS = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
module.exports = function getBasename(source, options, endpoint) {
    // options
    var basename = options.basename || options.filename;
    if (basename !== undefined) return basename;
    // path
    if (typeof source === "string") return path.basename(source);
    // stream
    if (source) {
        if (source.headers && source.headers["content-disposition"]) {
            var information = contentDisposition.parse(source.headers["content-disposition"]);
            return information.parameters.filename;
        }
        basename = source.basename || source.filename;
        if (basename !== undefined) return basename;
    }
    // endpoint
    if (endpoint) {
        basename = path.basename(endpoint.split("?")[0]);
        basename = basename.replace(POSIX, "!");
        basename = basename.replace(WINDOWS, "!");
        return basename;
    }
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}