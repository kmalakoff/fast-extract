import assert from 'assert';
import once from 'call-once-fn';
import path from 'path';
import PathToData from '../../src/streams/transforms/PathToData.ts';
import { DATA_DIR } from '../lib/constants.ts';

describe('PathToData', () => {
  describe('happy path', () => {
    it('should read file and end stream on success', (done) => {
      const transform = new PathToData();
      const chunks: Buffer[] = [];

      transform.on('data', (chunk) => chunks.push(chunk));
      transform.on('end', () => {
        const content = Buffer.concat(chunks).toString();
        assert.ok(content.includes('thing'), 'Should contain file content');
        done();
      });
      transform.on('error', done);

      // Write a path to the fixture.js file and end input
      transform.write(path.join(DATA_DIR, 'fixture.js'));
      transform.end();
    });

    it('should signal readable end after file read completes (via push null)', (done) => {
      const transform = new PathToData();
      const chunks: Buffer[] = [];
      const end = once(done);

      transform.on('data', (chunk) => chunks.push(chunk));
      transform.on('end', () => {
        const content = Buffer.concat(chunks).toString();
        assert.ok(content.includes('thing'), 'Should contain file content');
        end();
      });
      transform.on('error', end);

      // Write path but don't call .end() - the transform should signal end
      // via push(null) when the file read completes
      transform.write(path.join(DATA_DIR, 'fixture.js'), (err) => {
        if (err) return end(err);
        // File read is complete, give time for push(null) to propagate
        setTimeout(() => {
          transform.end(); // Clean up
          end(new Error('Readable stream did not end - push(null) was not called after file read'));
        }, 100);
      });
    });
  });

  describe('error handling', () => {
    it('should emit error for non-existent file', (done) => {
      const transform = new PathToData();

      transform.on('error', (err) => {
        assert.ok(err, 'Should emit error');
        done();
      });

      transform.write('/nonexistent/path/file.txt');
      transform.end();
    });
  });
});
