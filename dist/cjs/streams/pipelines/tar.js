"use strict";
var EntryProgressTransform = require("../transforms/EntryProgress.js");
var TarTransform = require("../transforms/Tar.js");
var PathToData = require("../transforms/PathToData.js");
var createWriteEntriesStream = require("../write/entries.js");
module.exports = function createTarPipeline(dest, streams, options) {
    var isPath = typeof options.source === "string";
    streams = streams.slice();
    !isPath || streams.unshift(new PathToData());
    streams.push(new TarTransform());
    !options.progress || streams.push(new EntryProgressTransform(options));
    streams.push(createWriteEntriesStream(dest, options));
    return streams;
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}