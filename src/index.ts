import './polyfills.ts';

import type { Callback, Options, Source } from './types.ts';
import worker from './worker.ts';

export { default as createWriteStream } from './createWriteStream.ts';
export * from './types.ts';

export default function fastExtract(src: Source, dest: string): Promise<undefined>;
export default function fastExtract(src: Source, options: Options): Promise<undefined>;
export default function fastExtract(src: Source, dest: string, options: Options): Promise<undefined>;

export default function fastExtract(src: Source, dest: string, callback: Callback): undefined;
export default function fastExtract(src: Source, options: Options, callback: Callback): undefined;
export default function fastExtract(src: Source, dest: string, options: Options, callback: Callback): undefined;

export default function fastExtract(src: Source, dest: string | Options | Callback, options?: Options | Callback, callback?: Callback): undefined | Promise<undefined> {
  if (options === undefined && typeof dest !== 'string') {
    callback = options as Callback;
    options = dest as Options;
    dest = null;
  }

  if (typeof options === 'function') {
    callback = options as Callback;
    options = null;
  }
  if (typeof options === 'string') options = { type: options };
  options = options || {};

  if (typeof callback === 'function') return worker(src, dest as string, options as Options, callback);
  return new Promise((resolve, reject) =>
    worker(src, dest as string, options as Options, (err?: Error) => {
      err ? reject(err) : resolve(undefined);
    })
  );
}
