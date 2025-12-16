const major = +process.versions.node.split('.')[0];

// Buffer.from (Node 4.5+)
// Check that Buffer.from exists and is not the Uint8Array.from that was incorrectly aliased in some versions
const hasBufferFrom = typeof Buffer.from === 'function' && Buffer.from !== Uint8Array.from;

export function bufferFrom(data: string | number[] | Buffer | Uint8Array, encoding?: BufferEncoding): Buffer {
  if (hasBufferFrom) {
    if (typeof data === 'string') {
      return Buffer.from(data, encoding);
    }
    return Buffer.from(data as number[] | Buffer);
  }
  // Node 0.8-4.4 fallback using deprecated Buffer constructor
  // biome-ignore lint/suspicious/noExplicitAny: Buffer constructor signature changed between Node versions
  return new (Buffer as any)(data, encoding);
}

// Buffer.alloc (Node 4.5+)
const hasBufferAlloc = typeof Buffer.alloc === 'function';

export function bufferAlloc(size: number, fill?: number | string | Buffer, encoding?: BufferEncoding): Buffer {
  if (hasBufferAlloc) {
    return Buffer.alloc(size, fill, encoding);
  }
  // Node 0.8-4.4 fallback
  // biome-ignore lint/suspicious/noExplicitAny: Buffer constructor signature changed between Node versions
  const buf = new (Buffer as any)(size);
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding);
    } else {
      buf.fill(fill);
    }
  } else {
    buf.fill(0);
  }
  return buf;
}

// Buffer.allocUnsafe (Node 4.5+)
const hasBufferAllocUnsafe = typeof Buffer.allocUnsafe === 'function';

export function bufferAllocUnsafe(size: number): Buffer {
  if (hasBufferAllocUnsafe) {
    return Buffer.allocUnsafe(size);
  }
  // Node 0.8-4.4 fallback
  // biome-ignore lint/suspicious/noExplicitAny: Buffer constructor signature changed between Node versions
  return new (Buffer as any)(size);
}

// Buffer.compare with offset support (full support Node 5+, basic in Node 0.12+)
// Node 0.12-4: buffer.compare(target) only - no offset support
// Node 5+: buffer.compare(target, targetStart, targetEnd, sourceStart, sourceEnd)
function compareOffset(source: Buffer, target: Buffer, targetStart: number, sourceStart: number, targetEnd: number, sourceEnd: number): number {
  const sourceLength = sourceEnd - sourceStart;
  const targetLength = targetEnd - targetStart;
  const length = Math.min(sourceLength, targetLength);

  for (let index = 0; index < length; index++) {
    const sourceValue = source[sourceStart + index];
    const targetValue = target[targetStart + index];
    if (sourceValue > targetValue) return 1;
    if (sourceValue < targetValue) return -1;
  }
  return 0;
}

export function bufferCompare(source: Buffer, target: Buffer, targetStart?: number, targetEnd?: number, sourceStart?: number, sourceEnd?: number): number {
  // If no offsets provided and basic compare exists, use it
  if (targetStart === undefined && typeof source.compare === 'function') {
    return source.compare(target);
  }

  // Node 5+ has full offset support
  if (major >= 5 && typeof source.compare === 'function') {
    return source.compare(target, targetStart, targetEnd, sourceStart, sourceEnd);
  }

  // Manual implementation for Node 0.8-4 or when offsets are needed
  if (targetStart === undefined) targetStart = 0;
  if (targetEnd === undefined) targetEnd = target.length;
  if (sourceStart === undefined) sourceStart = 0;
  if (sourceEnd === undefined) sourceEnd = source.length;

  if (sourceStart >= sourceEnd) return targetStart >= targetEnd ? 0 : -1;
  if (targetStart >= targetEnd) return 1;

  return compareOffset(source, target, targetStart, sourceStart, targetEnd, sourceEnd);
}
