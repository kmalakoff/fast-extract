import Stream from 'stream';

const major = +process.versions.node.split('.')[0];
let Readable: typeof Stream.Readable;
let Writable: typeof Stream.Writable;
let Transform: typeof Stream.Transform;
let PassThrough: typeof Stream.PassThrough;

if (major > 0) {
  Readable = Stream.Readable;
  Writable = Stream.Writable;
  Transform = Stream.Transform;
  PassThrough = Stream.PassThrough;
} else {
  const StreamCompat = require('readable-stream');
  Readable = StreamCompat.Readable;
  Writable = StreamCompat.Writable;
  Transform = StreamCompat.Transform;
  PassThrough = StreamCompat.PassThrough;
}

export { Readable, Writable, Transform, PassThrough };
