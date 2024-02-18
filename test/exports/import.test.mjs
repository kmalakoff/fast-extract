import assert from 'assert';
import extract from 'fast-extract';

describe('exports .mjs', () => {
  it('signature', () => {
    assert.ok(extract);
  });
});
