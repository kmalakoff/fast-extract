import StreamCompat from 'readable-stream';
import Stream from 'stream';

const major = +process.versions.node.split('.')[0];
export const Readable = major > 0 ? Stream.Readable : (StreamCompat.Readable as typeof Stream.Readable);
export const Writable = major > 0 ? Stream.Writable : (StreamCompat.Writable as typeof Stream.Writable);
export const Transform = major > 0 ? Stream.Transform : (StreamCompat.Transform as typeof Stream.Transform);
export const PassThrough = major > 0 ? Stream.PassThrough : (StreamCompat.PassThrough as typeof Stream.PassThrough);
