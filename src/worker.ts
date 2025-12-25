import fs from 'graceful-fs';
import oo from 'on-one';
import createWriteStream from './createWriteStream.ts';
import type { Callback, Options, OptionsInternal, Source } from './types.ts';

export default function extract(source: Source, dest: string, options_: Options, callback: Callback): void {
  const options: OptionsInternal = { source, ...options_ };
  const res = createWriteStream(dest, options);

  const inputStream = typeof source === 'string' ? fs.createReadStream(source) : source;
  const stream = inputStream.pipe(res);
  oo(stream, ['error', 'end', 'close', 'finish'], callback);
}
