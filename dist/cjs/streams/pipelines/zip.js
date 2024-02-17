"use strict";
var EntryProgressTransform = require("../transforms/EntryProgress.js");
var PathToData = require("../transforms/PathToData.js");
var WriteFileTransform = require("../transforms/WriteFile.js");
var ZipTransform = require("../transforms/Zip.js");
var createWriteEntriesStream = require("../write/entries.js");
module.exports = function createZipPipeline(dest, streams, options) {
    var isPath = typeof options.source === "string";
    streams = streams.slice();
    if (isPath) {
        if (streams.length) {
            streams.unshift(new PathToData());
            streams.push(new WriteFileTransform(dest, options));
        }
    } else {
        streams.push(new WriteFileTransform(dest, options));
    }
    streams.push(new ZipTransform());
    !options.progress || streams.push(new EntryProgressTransform(options));
    streams.push(createWriteEntriesStream(dest, options));
    return streams;
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}