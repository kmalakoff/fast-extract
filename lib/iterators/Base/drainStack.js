var processOrQueue = require('./processOrQueue');

function canProcess(iterator) {
  if (iterator.done || !iterator.queued.length) return false;
  if (iterator.entries.length) return true;
  if (!iterator.stack.length) return false;
  iterator.stack.shift()(); // queue another
  if (iterator.done) return false;
  if (iterator.entries.length) return true;
}

module.exports = function drainStack(iterator) {
  while (canProcess(iterator)) {
    processOrQueue(iterator, iterator.queued.pop());
  }
};
