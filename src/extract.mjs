import once from 'call-once-fn';
import eos from 'end-of-stream';

import createWriteStream from './createWriteStream.mjs';

export default function extract(source, dest, options, callback) {
  if (typeof options === 'string') options = { type: options };
  options = { source: source, ...options };
  const res = createWriteStream(dest, options);

  // path
  if (typeof source === 'string') {
    callback = once(callback);
    res.on('error', callback);
    res.write(source, 'utf8');
    return res.end(callback);
  }
  // stream

  return eos(source.pipe(res), callback);
}
