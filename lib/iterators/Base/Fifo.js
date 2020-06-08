var Fifo = require('fifo');

Fifo.prototype.find = function find(value) {
  for (var node = this.node; node; node = this.next(node)) {
    if (node.value === value) return node;
  }
  return null;
};

module.exports = Fifo;
