import Queue from 'queue-cb';
import rimraf2 from 'rimraf2';

export type Callback = (error?: Error) => undefined;

export default function rimrafAll(fullPaths: string[], callback: Callback): undefined {
  if (!fullPaths.length) return callback();

  const queue = new Queue(1);
  for (let index = 0; index < fullPaths.length; index++) {
    ((fullPath) => {
      queue.defer((callback) => {
        rimraf2(fullPath, { disableGlob: true }, (err) => {
          err && err.code !== 'ENOENT' ? callback(err) : callback();
        });
      });
    })(fullPaths[index]);
  }
  queue.await(callback);
}
