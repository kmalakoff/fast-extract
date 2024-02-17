"use strict";
var path = require("path");
var fs = require("fs");
var mkpath = require("mkpath");
var writer = require("flush-write-stream");
var Queue = require("queue-cb");
var tempSuffix = require("temp-suffix");
var writeTruncateFile = require("../../writeTruncateFile.js");
module.exports = function createFilePipeline(dest, options) {
    var tempDest = tempSuffix(dest);
    options._tempPaths.push(tempDest);
    var wroteSomething = false;
    return writer(function write(chunk, _encoding, callback) {
        var _this = this;
        wroteSomething = true;
        var appendFile = fs.appendFile.bind(fs, tempDest, chunk, callback);
        if (this.pathMade) return appendFile();
        mkpath(path.dirname(tempDest), function() {
            _this.pathMade = true;
            appendFile();
        });
    }, function flush(callback) {
        var queue = new Queue(1);
        queue.defer(function(callback) {
            mkpath(path.dirname(dest), function(err) {
                err && err.code !== "EEXIST" ? callback(err) : callback();
            });
        });
        wroteSomething ? queue.defer(fs.rename.bind(fs, tempDest, dest)) : queue.defer(writeTruncateFile.bind(null, dest));
        queue.await(callback);
    });
};

if ((typeof exports.default === 'function' || (typeof exports.default === 'object' && exports.default !== null)) && typeof exports.default.__esModule === 'undefined') {
  Object.defineProperty(exports.default, '__esModule', { value: true });
  for (var key in exports) exports.default[key] = exports[key];
  module.exports = exports.default;
}