module.exports = function processOrQueue(iterator, callback) {
  if (iterator.done) return callback(null, null);

  // nothing to process so queue
  if (!iterator.entries.length) return iterator.queued.unshift(callback);

  // errored somewhere
  var error = iterator.entries.peek().error;
  if (error) {
    iterator.destroy();
    return callback(error);
  }

  var entry = iterator.entries.pop();
  if (iterator.stack.length) iterator.stack.shift()(); // queue another
  callback(null, entry);
};
