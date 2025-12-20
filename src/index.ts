import type { Callback, Options, Source } from './types.ts';
import worker from './worker.ts';

export { default as createWriteStream } from './createWriteStream.ts';
export * from './types.ts';

export default function fastExtract(src: Source, dest: string): Promise<void>;
export default function fastExtract(src: Source, dest: string, type: string): Promise<void>;
export default function fastExtract(src: Source, options: Options): Promise<void>;
export default function fastExtract(src: Source, dest: string, options: Options): Promise<void>;

export default function fastExtract(src: Source, dest: string, callback: Callback): void;
export default function fastExtract(src: Source, dest: string, type: string, callback: Callback): void;
export default function fastExtract(src: Source, options: Options, callback: Callback): void;
export default function fastExtract(src: Source, dest: string, options: Options, callback: Callback): void;

export default function fastExtract(src: Source, dest: string | Options | Callback, options?: Options | Callback | string, callback?: Callback): void | Promise<void> {
  callback = typeof options === 'function' ? options : callback;
  options = typeof options === 'function' ? (dest as Options) || {} : typeof options === 'string' ? { type: options } : ((options || {}) as Options);
  options = typeof dest === 'string' ? options : { ...options, type: dest as string };

  if (typeof callback === 'function') return worker(src, dest as string, options, callback);
  return new Promise((resolve, reject) => worker(src, dest as string, options, (err?: Error) => (err ? reject(err) : resolve())));
}
