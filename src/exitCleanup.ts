import rimraf2 from 'rimraf2';
import onExit from 'signal-exit';

const fullPaths = [];

onExit(() => {
  while (fullPaths.length) {
    try {
      rimraf2.sync(fullPaths.pop(), { disableGlob: true });
    } catch (_err) {}
  }
});

function add(fullPath: string) {
  fullPaths.push(fullPath);
}

function remove(fullPath: string) {
  const index = fullPaths.indexOf(fullPath);
  if (index < 0) console.log(`Path does not exist for remove: ${fullPath}`);
  fullPaths.splice(index, 1);
}

export default {
  add,
  remove,
};
