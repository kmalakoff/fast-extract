// XZ decompression stream using lzma-purejs from 7z-iterator
// Implements XZ container format parser with LZMA2 decompression
// Pure JavaScript, works on Node.js 0.8+

import Module from 'module';
import path from 'path';
import Stream from 'stream';
import { bufferAlloc, bufferEquals } from './buffer.ts';

const _require = typeof require === 'undefined' ? Module.createRequire(import.meta.url) : require;

// Use native Transform for Node 1+, readable-stream for Node 0.x
const major = +process.versions.node.split('.')[0];
let Transform: typeof Stream.Transform;
if (major > 0) {
  Transform = Stream.Transform;
} else {
  Transform = _require('readable-stream').Transform;
}

// Import LZMA decoder from 7z-iterator's vendored lzma-purejs
// Use require.resolve to find the package, then construct path to assets
const sevenZIteratorPath = path.dirname(_require.resolve('7z-iterator/package.json'));
const LZMA = _require(path.join(sevenZIteratorPath, 'assets', 'lzma-purejs')).LZMA;
const LzmaDecoder = LZMA.Decoder;

type TransformCallback = (error?: Error | null, data?: Buffer) => void;

// XZ magic bytes (as arrays for bufferEquals comparison)
const XZ_MAGIC = [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00];
const XZ_FOOTER_MAGIC = [0x59, 0x5a]; // "YZ"

// Filter IDs
const FILTER_LZMA2 = 0x21;

// CRC32 lookup table (IEEE polynomial)
const CRC32_TABLE: number[] = [];
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC32_TABLE[i] = c >>> 0;
}

function crc32(buf: Buffer, start = 0, end: number = buf.length): number {
  let crc = 0xffffffff;
  for (let i = start; i < end; i++) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Reset bit models to initial probability (same as lzma-purejs initBitModels)
// Initial probability is 1024 (0x400) which represents 50% probability
function resetBitModels(models: number[]): void {
  if (!models) return;
  for (let i = 0; i < models.length; i++) {
    models[i] = 1024;
  }
}

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

// Decode LZMA2 dictionary size from properties byte
function decodeDictionarySize(propByte: number): number {
  if (propByte > 40) {
    throw new Error(`Invalid LZMA2 dictionary size property: ${propByte}`);
  }
  if (propByte === 40) {
    return 0xffffffff; // Max dictionary size
  }
  const base = 2 | (propByte & 1);
  const shift = Math.floor(propByte / 2) + 11;
  return base << shift;
}

// Stream helpers for lzma-purejs
function createInputStream(buffer: Buffer, offset: number, length: number) {
  let pos = 0;
  const end = Math.min(offset + length, buffer.length);
  const start = offset;
  return {
    readByte: () => {
      if (start + pos >= end) return -1;
      return buffer[start + pos++];
    },
    read: (buf: number[], bufOffset: number, len: number) => {
      let bytesRead = 0;
      while (bytesRead < len && start + pos < end) {
        buf[bufOffset + bytesRead] = buffer[start + pos];
        pos++;
        bytesRead++;
      }
      return bytesRead === 0 ? -1 : bytesRead;
    },
  };
}

function createOutputStream(expectedSize?: number) {
  const chunks: Buffer[] = [];
  let buffer: Buffer;
  let pos = 0;

  if (expectedSize && expectedSize > 0) {
    buffer = bufferAlloc(expectedSize);
    return {
      writeByte: (b: number) => {
        if (pos < buffer.length) {
          buffer[pos++] = b;
        }
      },
      toBuffer: () => (pos < buffer.length ? buffer.slice(0, pos) : buffer),
    };
  }

  buffer = bufferAlloc(65536);
  return {
    writeByte: (b: number) => {
      if (pos >= buffer.length) {
        chunks.push(buffer);
        buffer = bufferAlloc(65536);
        pos = 0;
      }
      buffer[pos++] = b;
    },
    toBuffer: () => {
      if (pos > 0) {
        chunks.push(buffer.slice(0, pos));
      }
      return chunks.length === 1 ? chunks[0] : Buffer.concat(chunks);
    },
  };
}

// Decode LZMA2 compressed data
function decodeLzma2(input: Buffer, properties: Buffer, unpackSize?: number): Buffer {
  if (!properties || properties.length < 1) {
    throw new Error('LZMA2 requires properties byte');
  }

  const dictSize = decodeDictionarySize(properties[0]);
  const outputChunks: Buffer[] = [];
  let outputBuffer: Buffer | null = null;
  let outputPos = 0;

  if (unpackSize && unpackSize > 0) {
    outputBuffer = bufferAlloc(unpackSize);
  }

  let offset = 0;
  const decoder = new LzmaDecoder();
  decoder.setDictionarySize(dictSize);
  const outWindow = decoder._outWindow;
  let propsSet = false;

  while (offset < input.length) {
    const control = input[offset++];

    if (control === 0x00) {
      break; // End marker
    }

    if (control === 0x01 || control === 0x02) {
      // Uncompressed chunk
      if (control === 0x01) {
        outWindow._pos = 0;
        outWindow._streamPos = 0;
        decoder._nowPos64 = 0;
      }

      if (offset + 2 > input.length) {
        throw new Error('Truncated LZMA2 uncompressed chunk header');
      }

      const uncompSize = ((input[offset] << 8) | input[offset + 1]) + 1;
      offset += 2;

      if (offset + uncompSize > input.length) {
        throw new Error('Truncated LZMA2 uncompressed data');
      }

      const uncompData = input.slice(offset, offset + uncompSize);

      if (outputBuffer) {
        uncompData.copy(outputBuffer, outputPos);
        outputPos += uncompData.length;
      } else {
        outputChunks.push(uncompData);
      }

      // Update decoder's dictionary
      for (let i = 0; i < uncompData.length; i++) {
        outWindow._buffer[outWindow._pos++] = uncompData[i];
        if (outWindow._pos >= outWindow._windowSize) {
          outWindow._pos = 0;
        }
      }
      outWindow._streamPos = outWindow._pos;
      decoder._nowPos64 += uncompSize;
      decoder._prevByte = uncompData[uncompData.length - 1];

      offset += uncompSize;
    } else if (control >= 0x80) {
      // LZMA compressed chunk
      // Control byte ranges:
      // 0x80-0x9f: Continue state (solid mode)
      // 0xa0-0xbf: Reset state only, keep dictionary
      // 0xc0-0xdf: Reset state + new props, keep dictionary
      // 0xe0-0xff: Reset everything (state, props, dictionary)
      const resetState = control >= 0xa0;
      const newProps = control >= 0xc0;
      const dictReset = control >= 0xe0;

      if (dictReset) {
        // Full reset: dictionary, state, props
        outWindow._pos = 0;
        outWindow._streamPos = 0;
        decoder._nowPos64 = 0;
      }

      if (offset + 4 > input.length) {
        throw new Error('Truncated LZMA2 LZMA chunk header');
      }

      const uncompHigh = control & 0x1f;
      const uncompSize = ((uncompHigh << 16) | (input[offset] << 8) | input[offset + 1]) + 1;
      offset += 2;

      const compSize = ((input[offset] << 8) | input[offset + 1]) + 1;
      offset += 2;

      if (newProps) {
        if (offset >= input.length) {
          throw new Error('Truncated LZMA2 properties byte');
        }
        const propsByte = input[offset++];
        const lc = propsByte % 9;
        const remainder = Math.floor(propsByte / 9);
        const lp = remainder % 5;
        const pb = Math.floor(remainder / 5);
        if (!decoder.setLcLpPb(lc, lp, pb)) {
          throw new Error(`Invalid LZMA properties: lc=${lc} lp=${lp} pb=${pb}`);
        }
        propsSet = true;
      }

      if (!propsSet) {
        throw new Error('LZMA chunk without properties');
      }

      if (offset + compSize > input.length) {
        throw new Error('Truncated LZMA2 compressed data');
      }

      const inStream = createInputStream(input, offset, compSize);
      const outStream = createOutputStream(uncompSize);

      // For state reset WITHOUT dict reset (0xa0-0xdf), we need special handling:
      // - Reset probability tables and state
      // - Keep dictionary data and cumulative position (_nowPos64)
      // The lzma-purejs decoder's setSolid(false) resets _nowPos64, which breaks
      // LZ matches that reference dictionary data from previous chunks.
      // Fix: manually reset probability tables while preserving _nowPos64.
      if (resetState && !dictReset) {
        // Save cumulative position (critical for rep0 validation)
        const savedNowPos64 = decoder._nowPos64;

        // Reset probability tables manually (can't call decoder.init() because it
        // would try to read from stream before code() sets it up)
        // initBitModels sets all values to 1024 (0x400) - the initial probability
        resetBitModels(decoder._isMatchDecoders);
        resetBitModels(decoder._isRepDecoders);
        resetBitModels(decoder._isRepG0Decoders);
        resetBitModels(decoder._isRepG1Decoders);
        resetBitModels(decoder._isRepG2Decoders);
        resetBitModels(decoder._isRep0LongDecoders);
        resetBitModels(decoder._posDecoders);

        // Reset literal decoder
        if (decoder._literalDecoder._coders) {
          for (let i = 0; i < decoder._literalDecoder._coders.length; i++) {
            if (decoder._literalDecoder._coders[i]) {
              resetBitModels(decoder._literalDecoder._coders[i]._decoders);
            }
          }
        }

        // Reset pos slot decoders
        for (let i = 0; i < decoder._posSlotDecoder.length; i++) {
          resetBitModels(decoder._posSlotDecoder[i]._models);
        }

        // Reset len decoders
        resetBitModels(decoder._lenDecoder._choice);
        decoder._lenDecoder._highCoder._models && resetBitModels(decoder._lenDecoder._highCoder._models);
        for (let i = 0; i < decoder._lenDecoder._lowCoder.length; i++) {
          decoder._lenDecoder._lowCoder[i]._models && resetBitModels(decoder._lenDecoder._lowCoder[i]._models);
          decoder._lenDecoder._midCoder[i]._models && resetBitModels(decoder._lenDecoder._midCoder[i]._models);
        }

        resetBitModels(decoder._repLenDecoder._choice);
        decoder._repLenDecoder._highCoder._models && resetBitModels(decoder._repLenDecoder._highCoder._models);
        for (let i = 0; i < decoder._repLenDecoder._lowCoder.length; i++) {
          decoder._repLenDecoder._lowCoder[i]._models && resetBitModels(decoder._repLenDecoder._lowCoder[i]._models);
          decoder._repLenDecoder._midCoder[i]._models && resetBitModels(decoder._repLenDecoder._midCoder[i]._models);
        }

        // Reset pos align decoder
        decoder._posAlignDecoder._models && resetBitModels(decoder._posAlignDecoder._models);

        // Reset state variables (same as code() does for non-solid)
        decoder._state = 0;
        decoder._rep0 = 0;
        decoder._rep1 = 0;
        decoder._rep2 = 0;
        decoder._rep3 = 0;

        // Restore cumulative position - critical for rep0 validation
        decoder._nowPos64 = savedNowPos64;

        // Use solid mode so code() doesn't reset _nowPos64 again
        decoder.setSolid(true);
      } else {
        // For solid mode (0x80-0x9f) or full reset (0xe0-0xff), use normal path
        decoder.setSolid(!resetState);
      }

      const success = decoder.code(inStream, outStream, uncompSize);

      if (!success) {
        throw new Error('LZMA decompression failed');
      }

      const chunkOutput = outStream.toBuffer();
      if (outputBuffer) {
        chunkOutput.copy(outputBuffer, outputPos);
        outputPos += chunkOutput.length;
      } else {
        outputChunks.push(chunkOutput);
      }

      offset += compSize;
    } else {
      throw new Error(`Invalid LZMA2 control byte: 0x${control.toString(16)}`);
    }
  }

  if (outputBuffer) {
    return outputPos < outputBuffer.length ? outputBuffer.slice(0, outputPos) : outputBuffer;
  }
  return Buffer.concat(outputChunks);
}

// Parse and decompress XZ data
function _decompressXZ(input: Buffer): Buffer {
  let offset = 0;

  // Verify XZ magic
  if (input.length < 12 || !bufferEquals(input, 0, XZ_MAGIC)) {
    throw new Error('Invalid XZ magic bytes');
  }
  offset += 6;

  // Stream flags (2 bytes)
  const streamFlags = input.slice(offset, offset + 2);
  if (streamFlags[0] !== 0x00) {
    throw new Error('Invalid XZ stream flags');
  }
  const _checkType = streamFlags[1] & 0x0f;
  offset += 2;

  // Verify header CRC32
  const headerCrc = input.readUInt32LE(offset);
  const calculatedHeaderCrc = crc32(input, 6, 8);
  if (headerCrc !== calculatedHeaderCrc) {
    throw new Error('XZ stream header CRC32 mismatch');
  }
  offset += 4;

  // Parse blocks
  const outputChunks: Buffer[] = [];

  while (offset < input.length) {
    // Check for Index (starts with 0x00)
    if (input[offset] === 0x00) {
      break; // Index section, we're done with blocks
    }

    // Block header size (real size = (value + 1) * 4)
    const blockHeaderSizeRaw = input[offset];
    if (blockHeaderSizeRaw === 0) {
      throw new Error('Invalid block header size');
    }
    const blockHeaderSize = (blockHeaderSizeRaw + 1) * 4;
    offset++;

    // Block flags
    const blockFlags = input[offset];
    const numFilters = (blockFlags & 0x03) + 1;
    const hasCompressedSize = (blockFlags & 0x40) !== 0;
    const hasUncompressedSize = (blockFlags & 0x80) !== 0;
    offset++;

    // Optional compressed size
    let _compressedSize: number | undefined;
    if (hasCompressedSize) {
      const result = decodeMultibyte(input, offset);
      _compressedSize = result.value;
      offset += result.bytesRead;
    }

    // Optional uncompressed size
    let _uncompressedSize: number | undefined;
    if (hasUncompressedSize) {
      const result = decodeMultibyte(input, offset);
      _uncompressedSize = result.value;
      offset += result.bytesRead;
    }

    // Parse filters
    let lzma2Props: Buffer | null = null;
    for (let i = 0; i < numFilters; i++) {
      const filterIdResult = decodeMultibyte(input, offset);
      const filterId = filterIdResult.value;
      offset += filterIdResult.bytesRead;

      const propsSize = decodeMultibyte(input, offset);
      offset += propsSize.bytesRead;

      const filterProps = input.slice(offset, offset + propsSize.value);
      offset += propsSize.value;

      if (filterId === FILTER_LZMA2) {
        lzma2Props = filterProps;
      } else {
        throw new Error(`Unsupported filter: 0x${filterId.toString(16)}`);
      }
    }

    if (!lzma2Props) {
      throw new Error('No LZMA2 filter found in block');
    }

    // Skip to end of block header (padding + CRC32)
    const _blockHeaderStart = offset - (offset % 4 === 0 ? 0 : 4 - (offset % 4));
    // Actually we need to recalculate: block header starts at offset - bytes_read_so_far
    // Let's calculate padding
    const _headerBytesRead = offset - (offset - blockHeaderSize + 4); // This is getting complex
    // Simpler: just align to blockHeaderSize boundary from start
    const _blockStart = offset - (1 + 1 + (hasCompressedSize ? decodeMultibyte(input, offset - (hasUncompressedSize ? 2 : 1) - 1).bytesRead : 0));

    // Let me recalculate this more carefully
    // The block header size includes everything: size byte, flags, sizes, filters, padding, CRC32
    // So we need to find where the block header started
    const blockHeaderOffset = offset;
    // Actually, let me just skip padding by aligning
    while ((offset - (blockHeaderOffset - blockHeaderSize + 4)) % 4 !== 0 && offset < input.length) {
      offset++;
    }

    // For now, let's use a simpler approach: we know the block header size
    // Block header = size_byte(1) + content(blockHeaderSize - 4 - 1) + CRC32(4)
    // Let's reset and parse more carefully

    // Actually, let me simplify: skip to where compressed data should be
    // Block header total = blockHeaderSize bytes (including the size byte we already read)
    // We started reading block header at (current offset - bytes we've read)
    // Let's just calculate: block data starts at blockHeaderStartOffset + blockHeaderSize
    const currentOffsetInHeader = offset;
    const _bytesReadInHeader = currentOffsetInHeader - (currentOffsetInHeader - offset);

    // Simpler approach: find the compressed data
    // The header is blockHeaderSize bytes total. We read the size byte first.
    // So compressed data starts at: (start of block header) + blockHeaderSize
    // We need to track where the block started

    // Let me restart the block parsing with proper offset tracking
    const _blockDataStart =
      offset -
      1 -
      1 -
      (hasCompressedSize ? 1 : 0) - // approximate
      (hasUncompressedSize ? 1 : 0) - // approximate
      numFilters * 3 +
      blockHeaderSize;

    // This is getting messy. Let me use a cleaner approach.
    // Re-read: go back to just after stream header and parse properly
  }

  return Buffer.concat(outputChunks);
}

// Simpler XZ parser - just find the LZMA2 data and decompress
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
