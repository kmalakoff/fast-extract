import { safeRm } from 'fs-remove-compat';
import Queue from 'queue-cb';

export type Callback = (error?: Error) => void;

export default function rimrafAll(fullPaths: string[], callback: Callback): void {
  if (!fullPaths.length) return callback();

  const queue = new Queue(1);
  for (let index = 0; index < fullPaths.length; index++) {
    ((fullPath) => {
      queue.defer((callback) => {
        safeRm(fullPath, callback);
      });
    })(fullPaths[index]);
  }
  queue.await(callback);
}
