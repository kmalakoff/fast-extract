// only patch legacy versions of node.js
var major = +process.versions.node.split('.')[0];
if (major === 0) {
  var mock = require('mock-require-lazy');
  mock('readable-stream', require('readable-stream'));
  mock('bl', require('bl'));
}

if (!Buffer.from) {
  Buffer.from = function from(data) {
    // eslint-disable-next-line node/no-deprecated-api
    return new Buffer(data);
  };
}
if (!Buffer.alloc) Buffer.alloc = Buffer.from;

var stream = require('stream');
if (!stream.Readable) {
  var legacyStream = require('readable-stream');
  stream.Readable = legacyStream.Readable;
  stream.Writable = legacyStream.Writable;
  stream.Transform = legacyStream.Transform;
  stream.PassThrough = legacyStream.PassThrough;
}

if (typeof setimmediate === 'undefined') global.setImmediate = require('next-tick');
