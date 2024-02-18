import rimraf from 'rimraf';
import onExit from 'signal-exit';

const fullPaths = [];

onExit(function exist(_code, _signal) {
  while (fullPaths.length) {
    try {
      rimraf.sync(fullPaths.pop());
    } catch (_err) {}
  }
});

function add(fullPath) {
  fullPaths.push(fullPath);
};

function remove(fullPath) {
  const index = fullPaths.indexOf(fullPath);
  if (index < 0) console.log(`Path does not exist for remove: ${fullPath}`);
  fullPaths.splice(index, 1);
};

export default {
  add, remove
}