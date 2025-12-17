import { safeRmSync } from 'fs-remove-compat';
import onExit from 'signal-exit';

const fullPaths = [];

onExit(() => {
  while (fullPaths.length) {
    try {
      safeRmSync(fullPaths.pop());
    } catch (_err) {}
  }
});

function add(fullPath: string) {
  fullPaths.push(fullPath);
}

function remove(fullPath: string) {
  const index = fullPaths.indexOf(fullPath);
  if (index >= 0) fullPaths.splice(index, 1);
}

export default {
  add,
  remove,
};
