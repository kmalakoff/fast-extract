// BZip2 decompression stream using seek-bzip (pure JavaScript)
// Inspired by unbzip2-stream (https://github.com/nicois/unbzip2-stream) by Nick Johnson
// Uses seek-bzip (https://github.com/nicois/seek-bzip) by Ian Walter
// Pattern from 7z-iterator: buffering decoder that collects all input, decompresses in flush

import Module from 'module';
import Stream from 'stream';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

// Use native Transform for Node 1+, readable-stream for Node 0.x
const major = +process.versions.node.split('.')[0];
let Transform: typeof Stream.Transform;
if (major > 0) {
  Transform = Stream.Transform;
} else {
  Transform = _require('readable-stream').Transform;
}

// seek-bzip for bzip2 decompression (pure JS, works on Node 0.8+)
const Bunzip = _require('seek-bzip');

type TransformCallback = (error?: Error | null, data?: Buffer) => void;

/**
 * Create a BZip2 decompression Transform stream
 * Uses buffering decoder pattern: collects all input chunks, decompresses in flush
 */
export default function unbzip2Stream(): Stream.Transform {
  const chunks: Buffer[] = [];

  return new Transform({
    transform(chunk: Buffer, _encoding: string, callback: TransformCallback) {
      chunks.push(chunk);
      callback();
    },
    flush(callback: TransformCallback) {
      try {
        const input = Buffer.concat(chunks);
        const output = Bunzip.decode(input);
        this.push(output);
        callback();
      } catch (err) {
        callback(err as Error);
      }
    },
  });
}
