"use strict";
var progressStream = require("progress-stream");
var statsSize = require("../../sourceStats/size");
module.exports = function DataProgressTransform(options) {
    var stats = {
        basename: options.basename
    };
    var progress = progressStream({
        time: options.time
    }, function(update) {
        options.progress(Object.assign({
            progress: "write"
        }, update, stats));
    });
    statsSize(options.source, options, function(err, size) {
        err || progress.setLength(size || 0);
    });
    return progress;
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}