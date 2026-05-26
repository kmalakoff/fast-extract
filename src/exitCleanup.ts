import { safeRmSync } from 'fs-remove-compat';
import onExit from 'signal-exit';

const fullPaths: string[] = [];

onExit(() => {
  while (fullPaths.length) {
    try {
      safeRmSync(fullPaths.pop() as string);
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
