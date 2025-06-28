// import 'buffer-v6-polyfill';

// import Module from 'module';
// import stream from 'stream';

// const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

// // only patch legacy versions of node.js
// const major = +process.versions.node.split('.')[0];
// if (major === 0) {
//   const mock = _require('mock-require-lazy');
//   mock('readable-stream', _require('readable-stream'));
//   mock('bl', _require('bl'));
// }

// if (!stream.Readable) {
//   const patch = _require('readable-stream');
//   stream.Readable = patch.Readable;
//   stream.Writable = patch.Writable;
//   stream.Transform = patch.Transform;
//   stream.PassThrough = patch.PassThrough;
// }

// if (typeof setImmediate === 'undefined') global.setImmediate = _require('next-tick');
