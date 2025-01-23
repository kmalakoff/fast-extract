import once from 'call-once-fn';
import oo from 'on-one';

import createWriteStream from './createWriteStream.mjs';

export default function extract(source, dest, options, callback) {
  if (typeof options === 'string') options = { type: options };
  options = { source: source, ...options };
  const res = createWriteStream(dest, options);

  // path
  if (typeof source === 'string') {
    const end = once(callback);
    res.on('error', end);
    res.write(source, 'utf8');
    return res.end(end);
  }

  // stream
  const stream = source.pipe(res);
  oo(stream, ['error', 'end', 'close', 'finish'], callback);
}
