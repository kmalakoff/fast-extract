import assert from 'assert';
// @ts-ignore
import extract from 'fast-extract';

describe('exports .ts', () => {
  it('signature', () => {
    assert.ok(extract);
  });
});
