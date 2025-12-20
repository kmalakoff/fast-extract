// XZ decompression stream using 7z-iterator's LZMA2 decoder
// Implements XZ container format parser with LZMA2 decompression
// Pure JavaScript, works on Node.js 0.8+

import { decodeLzma2 } from '7z-iterator';
import Module from 'module';
import Stream from 'stream';
import { bufferEquals } from './buffer.ts';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

// Use native Transform for Node 1+, readable-stream for Node 0.x
const major = +process.versions.node.split('.')[0];
let Transform: typeof Stream.Transform;
if (major > 0) {
  Transform = Stream.Transform;
} else {
  Transform = _require('readable-stream').Transform;
}

type TransformCallback = (error?: Error | null, data?: Buffer) => void;

// XZ magic bytes (as arrays for bufferEquals comparison)
const XZ_MAGIC = [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00];
const XZ_FOOTER_MAGIC = [0x59, 0x5a]; // "YZ"

// Filter IDs
const FILTER_LZMA2 = 0x21;

// Decode variable-length integer (XZ multibyte encoding)
function decodeMultibyte(buf: Buffer, offset: number): { value: number; bytesRead: number } {
  let value = 0;
  let i = 0;
  let byte: number;
  do {
    if (offset + i >= buf.length) {
      throw new Error('Truncated multibyte integer');
    }
    byte = buf[offset + i];
    value |= (byte & 0x7f) << (i * 7);
    i++;
    if (i > 9) {
      throw new Error('Multibyte integer too large');
    }
  } while (byte & 0x80);
  return { value, bytesRead: i };
}

// XZ parser - extract LZMA2 data and decompress using 7z-iterator
function decompressXZSimple(input: Buffer): Buffer {
  // Verify XZ magic
  if (input.length < 12 || !bufferEquals(input, 0, XZ_MAGIC)) {
    throw new Error('Invalid XZ magic bytes');
  }

  // Stream flags at offset 6-7
  const checkType = input[7] & 0x0f;

  // Check sizes based on check type
  const checkSizes: { [key: number]: number } = {
    0: 0, // None
    1: 4, // CRC32
    4: 8, // CRC64
    10: 32, // SHA-256
  };
  const checkSize = checkSizes[checkType] ?? 0;

  // Block starts at offset 12
  let offset = 12;

  // Block header size
  const blockHeaderSizeRaw = input[offset];
  if (blockHeaderSizeRaw === 0) {
    throw new Error('Invalid block header size (index indicator found instead of block)');
  }
  const blockHeaderSize = (blockHeaderSizeRaw + 1) * 4;

  // Parse block header to find LZMA2 properties
  const blockHeaderStart = offset;
  offset++; // skip size byte

  const blockFlags = input[offset++];
  const numFilters = (blockFlags & 0x03) + 1;
  const hasCompressedSize = (blockFlags & 0x40) !== 0;
  const hasUncompressedSize = (blockFlags & 0x80) !== 0;

  // Skip optional sizes
  if (hasCompressedSize) {
    const result = decodeMultibyte(input, offset);
    offset += result.bytesRead;
  }

  let uncompressedSize: number | undefined;
  if (hasUncompressedSize) {
    const result = decodeMultibyte(input, offset);
    uncompressedSize = result.value;
    offset += result.bytesRead;
  }

  // Parse filter (should be LZMA2)
  let lzma2Props: Buffer | null = null;
  for (let i = 0; i < numFilters; i++) {
    const filterIdResult = decodeMultibyte(input, offset);
    const filterId = filterIdResult.value;
    offset += filterIdResult.bytesRead;

    const propsSizeResult = decodeMultibyte(input, offset);
    offset += propsSizeResult.bytesRead;

    const filterProps = input.slice(offset, offset + propsSizeResult.value);
    offset += propsSizeResult.value;

    if (filterId === FILTER_LZMA2) {
      lzma2Props = filterProps;
    } else if (filterId !== 0x03 && filterId !== 0x04 && filterId !== 0x05 && filterId !== 0x06 && filterId !== 0x07 && filterId !== 0x08 && filterId !== 0x09 && filterId !== 0x0a) {
      // BCJ filters (0x04-0x0a) and Delta (0x03) are preprocessing filters
      // For now, only support LZMA2 alone
      throw new Error(`Unsupported filter: 0x${filterId.toString(16)}`);
    }
  }

  if (!lzma2Props) {
    throw new Error('No LZMA2 filter found in XZ block');
  }

  // Skip to end of block header (align to 4 bytes + CRC32)
  const blockDataStart = blockHeaderStart + blockHeaderSize;

  // Find the end of compressed data (look for index from the footer)
  // Footer is last 12 bytes: CRC32(4) + Backward Size(4) + Stream Flags(2) + Magic(2)
  if (input.length < 12) {
    throw new Error('XZ file too small');
  }

  // Verify footer magic
  if (!bufferEquals(input, input.length - 2, XZ_FOOTER_MAGIC)) {
    throw new Error('Invalid XZ footer magic');
  }

  // Get backward size (tells us where index starts)
  // Footer: CRC32(4) at -12, Backward Size(4) at -8, Stream Flags(2) at -4, Magic(2) at -2
  const backwardSize = (input.readUInt32LE(input.length - 8) + 1) * 4;
  const indexStart = input.length - 12 - backwardSize;

  // Compressed data is between block header and index
  // But we need to account for block padding and check
  // The block structure is: [Header][Compressed Data][Padding to 4 bytes][Check]
  // Then index follows

  // For now, find where the compressed data ends by looking for end of LZMA2 stream
  // LZMA2 ends with control byte 0x00

  // Extract all data between block header end and index start
  let compressedDataEnd = indexStart;

  // Account for check at end of block
  compressedDataEnd -= checkSize;

  // Account for padding (up to 3 bytes of 0x00)
  while (compressedDataEnd > blockDataStart && input[compressedDataEnd - 1] === 0x00) {
    compressedDataEnd--;
  }
  // Add back one 0x00 for LZMA2 end marker
  compressedDataEnd++;

  const compressedData = input.slice(blockDataStart, compressedDataEnd);

  // Decompress LZMA2 data
  return decodeLzma2(compressedData, lzma2Props, uncompressedSize);
}

/**
 * Create an XZ decompression Transform stream
 * Uses buffering pattern: collects all input chunks, decompresses in flush
 */
export default function xzStream(): Stream.Transform {
  const chunks: Buffer[] = [];

  return new Transform({
    transform(chunk: Buffer, _encoding: string, callback: TransformCallback) {
      chunks.push(chunk);
      callback();
    },
    flush(callback: TransformCallback) {
      try {
        const input = Buffer.concat(chunks);
        const output = decompressXZSimple(input);
        this.push(output);
        callback();
      } catch (err) {
        callback(err as Error);
      }
    },
  });
}
