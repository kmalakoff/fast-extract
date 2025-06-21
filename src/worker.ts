import once from 'call-once-fn';
import oo from 'on-one';
import createWriteStream from './createWriteStream.ts';
import type { Callback, Options, OptionsInternal, Source } from './types.ts';

export default function extract(source: Source, dest: string, options_: Options, callback: Callback): undefined {
  const options: OptionsInternal = { source, ...options_ };
  const res = createWriteStream(dest, options);

  // path
  if (typeof source === 'string') {
    const end = once(callback);
    res.on('error', end);
    res.write(source, 'utf8');
    res.end(end);
    return;
  }

  // stream
  const stream = source.pipe(res);
  oo(stream, ['error', 'end', 'close', 'finish'], callback);
}
