var Fifo = require('fifo');

Fifo.prototype.find = function find(value) {
  for (var node = this.node; node; node = this.next(node)) {
    if (node.value === value) return node;
  }
  return null;
};

Fifo.prototype.peek = function peek() {
  return this.length ? this.last() : undefined;
};

module.exports = Fifo;
