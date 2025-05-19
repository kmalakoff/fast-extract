import Queue from 'queue-cb';
import rimraf2 from 'rimraf2';

export default function rimrafAll(fullPaths, callback) {
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
