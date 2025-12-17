import assert from 'assert';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import { bufferFrom } from '../../src/compat/buffer.ts';
import DestinationRemove from '../../src/streams/transforms/DestinationRemove.ts';
import { TMP_DIR } from '../lib/constants.ts';

describe('DestinationRemove', () => {
  beforeEach((done) => {
    safeRm(TMP_DIR, () => {
      mkdirp(TMP_DIR, done);
    });
  });

  it('should succeed when destination does not exist', (done) => {
    // safeRm handles non-existent paths gracefully (returns no error)
    const nonExistentPath = path.join(TMP_DIR, `nonexistent-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const transform = new DestinationRemove(nonExistentPath);
    const chunk = bufferFrom('test data');

    transform._transform(chunk, 'utf8', (err, result) => {
      assert.ifError(err);
      assert.strictEqual(result, chunk);
      done();
    });
  });

  it('should remove existing directory', (done) => {
    const existingDir = path.join(TMP_DIR, `existing-dir-${Date.now()}`);
    mkdirp(existingDir, (err) => {
      assert.ifError(err);
      // Create a file inside to verify removal
      fs.writeFileSync(path.join(existingDir, 'test.txt'), 'content');

      const transform = new DestinationRemove(existingDir);
      const chunk = bufferFrom('test data');

      transform._transform(chunk, 'utf8', (err, result) => {
        assert.ifError(err);
        assert.strictEqual(result, chunk);
        // Verify directory was removed
        assert.ok(!fs.existsSync(existingDir), 'Directory should be removed');
        done();
      });
    });
  });

  it('should only remove once (idempotent)', (done) => {
    const existingDir = path.join(TMP_DIR, `idempotent-test-${Date.now()}`);
    mkdirp(existingDir, (err) => {
      assert.ifError(err);

      const transform = new DestinationRemove(existingDir);
      const chunk1 = bufferFrom('chunk1');
      const chunk2 = bufferFrom('chunk2');

      // First transform removes the directory
      transform._transform(chunk1, 'utf8', (err, result) => {
        assert.ifError(err);
        assert.strictEqual(result, chunk1);

        // Second transform should pass through without attempting removal again
        transform._transform(chunk2, 'utf8', (err, result) => {
          assert.ifError(err);
          assert.strictEqual(result, chunk2);
          done();
        });
      });
    });
  });
});
