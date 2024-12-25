require('buffer-v6-polyfill');

// only patch legacy versions of node.js
const major = +process.versions.node.split('.')[0];
if (major === 0) {
  const mock = require('mock-require-lazy');
  mock('readable-stream', require('readable-stream'));
  mock('bl', require('bl'));
}

const stream = require('stream');
if (!stream.Readable) {
  const patch = require('readable-stream');
  stream.Readable = patch.Readable;
  stream.Writable = patch.Writable;
  stream.Transform = patch.Transform;
  stream.PassThrough = patch.PassThrough;
}

if (typeof setimmediate === 'undefined') global.setImmediate = require('next-tick');
