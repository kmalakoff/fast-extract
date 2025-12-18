import fs from 'fs';
import oo from 'on-one';
import createWriteStream from './createWriteStream.ts';
import type { Callback, Options, OptionsInternal, Source } from './types.ts';

export default function extract(source: Source, dest: string, options_: Options, callback: Callback): void {
  const options: OptionsInternal = { source, ...options_ };
  const res = createWriteStream(dest, options);

  // path - pipe file stream directly (end propagates naturally)
  if (typeof source === 'string') {
    source = fs.createReadStream(source);
  }

  // stream - proper piping, end propagates through pipeline
  const stream = source.pipe(res);
  oo(stream, ['error', 'end', 'close', 'finish'], callback);
}
