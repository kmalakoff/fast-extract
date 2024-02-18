const assert = require('assert');
const extract = require('fast-extract');

describe('exports .cjs', () => {
  it('signature', () => {
    assert.ok(extract);
  });
});
