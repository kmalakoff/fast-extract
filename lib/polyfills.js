require('core-js/actual/object/assign');
require('buffer-v6-polyfill');

// only patch legacy versions of node.js
var major = +process.versions.node.split('.')[0];
if (major === 0) {
  var mock = require('mock-require-lazy');
  mock('readable-stream', require('readable-stream'));
  mock('bl', require('bl'));
}

var stream = require('stream');
if (!stream.Readable) {
  var patch = require('readable-stream');
  stream.Readable = patch.Readable;
  stream.Writable = patch.Writable;
  stream.Transform = patch.Transform;
  stream.PassThrough = patch.PassThrough;
}

if (typeof setimmediate === 'undefined') global.setImmediate = require('next-tick');
