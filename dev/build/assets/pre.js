/* COMPATIBILITY POLYFILLS */

var major = +process.versions.node.split(".")[0];

var Buffer = require('safe-buffer').Buffer;
var BufferComparePolyfill = require("./buffer-compare.cjs");
var BufferCompare = major > 4 ? function (source) { return source.compare.apply(source, Array.prototype.slice.call(arguments, 1)); } : function (_source) { return BufferComparePolyfill.apply(null, Array.prototype.slice.call(arguments)); }

var MathTrunc = Math.trunc || function (val) { return val < 0 ? Math.ceil(val) : Math.floor(val); };
/* COMPATIBILITY POLYFILLS */
