"use strict";
var path = require("path");
var createWriteStream = require("../write/file.js");
var DataProgressTransform = require("../transforms/DataProgress.js");
var PathToData = require("../transforms/PathToData.js");
var statsBasename = require("../../sourceStats/basename");
module.exports = function createFilePipeline(dest, streams, options) {
    var isPath = typeof options.source === "string";
    var basename = statsBasename(options.source, options);
    var fullPath = basename === undefined ? dest : path.join(dest, basename);
    streams = streams.slice();
    !isPath || streams.unshift(new PathToData());
    !options.progress || streams.push(new DataProgressTransform(Object.assign({
        basename: basename,
        fullPath: fullPath
    }, options)));
    streams.push(createWriteStream(fullPath, options));
    return streams;
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}