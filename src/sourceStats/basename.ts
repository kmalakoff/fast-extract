import contentDisposition from 'content-disposition';
import path from 'path';

// biome-ignore lint/suspicious/noControlCharactersInRegex: Platform specific characters
const POSIX = /[<>:"\\/\\|?*\x00-\x1F]/g;
const WINDOWS = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;

import type { Options, Source } from '../types.js';

export default function getBasename(source: Source, options: Options, endpoint?: string): string {
  // options
  let basename = options.basename || options.filename;
  if (basename !== undefined) return basename;

  // path
  if (typeof source === 'string') return path.basename(source);
  // stream
  if (source) {
    if (source.headers && source.headers['content-disposition']) {
      const information = contentDisposition.parse(source.headers['content-disposition']);
      return information.parameters.filename;
    }
    basename = source.basename || source.filename;
    if (basename !== undefined) return basename;
  }

  // endpoint
  if (endpoint) {
    basename = path.basename(endpoint.split('?')[0]);
    basename = basename.replace(POSIX, '!');
    basename = basename.replace(WINDOWS, '!');
    return basename;
  }
}
