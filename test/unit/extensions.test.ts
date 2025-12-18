import assert from 'assert';
import cr from 'cr';
import extract from 'fast-extract';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import { CONTENTS, TARGET, TMP_DIR } from '../lib/constants.ts';
import { DATA_DIR, getFixture } from '../lib/fixtures.ts';
import getStats from '../lib/getStats.ts';

const EXTRACT_TYPES = ['tar', 'tar.bz2', 'tar.gz', 'tgz', 'js.gz', 'js', 'zip', '7z', 'tar.xz'];

interface SpecifiedStream {
  filename?: string;
  basename?: string;
}

function isArchiveType(type: string): boolean {
  return type.indexOf('js') !== 0;
}

function verifyExtraction(type: string, callback: (err?: Error) => void) {
  if (isArchiveType(type)) {
    const fixtureName = type === 'tgz' ? 'fixture.tgz' : `fixture.${type}`;
    const { expected } = getFixture(fixtureName);
    getStats(
      TARGET,
      (err, stats) => {
        if (err) return callback(err);
        assert.equal(stats.dirs, expected.dirs, `expected ${expected.dirs} dirs, got ${stats.dirs}`);
        assert.equal(stats.files, expected.files, `expected ${expected.files} files, got ${stats.files}`);
        assert.equal(stats.links, expected.links, `expected ${expected.links} links, got ${stats.links}`);
        callback();
      },
      (_fullPath, content) => {
        assert.equal(cr(content.toString()), CONTENTS, 'file content mismatch');
      }
    );
  } else {
    const files = fs.readdirSync(TARGET);
    assert.equal(files.length, 1);
    const expectedNames = type === 'js.gz' ? ['fixture.js.gz', 'fixture-js.gz'] : ['fixture.js', 'fixture-js'];
    assert.ok(expectedNames.indexOf(files[0]) >= 0, `expected one of ${expectedNames.join(', ')}, got ${files[0]}`);
    assert.equal(cr(fs.readFileSync(path.join(TARGET, files[0])).toString()), CONTENTS);
    callback();
  }
}

function verifyArchiveNoStrip(type: string, callback: (err?: Error) => void) {
  const fixtureName = type === 'tgz' ? 'fixture.tgz' : `fixture.${type}`;
  const { expected } = getFixture(fixtureName);
  const dataPath = path.join(TARGET, 'data');
  getStats(
    dataPath,
    (err, stats) => {
      if (err) return callback(err);
      assert.equal(stats.dirs, expected.dirs, `expected ${expected.dirs} dirs, got ${stats.dirs}`);
      assert.equal(stats.files, expected.files, `expected ${expected.files} files, got ${stats.files}`);
      assert.equal(stats.links, expected.links, `expected ${expected.links} links, got ${stats.links}`);
      callback();
    },
    (_fullPath, content) => {
      assert.equal(cr(content.toString()), CONTENTS, 'file content mismatch');
    }
  );
}

function addTests(type) {
  describe(type, () => {
    it('extract file', (done) => {
      extract(path.join(DATA_DIR, `fixture.${type}`), TARGET, { strip: 1 }, (err) => {
        if (err) {
          done(err);
          return;
        }
        verifyExtraction(type, done);
      });
    });

    it('extract file without type - dot', (done) => {
      extract(path.join(DATA_DIR, `fixture-${type}`), TARGET, { strip: 1, type: `.${type}` }, (err) => {
        if (err) {
          done(err);
          return;
        }
        verifyExtraction(type, done);
      });
    });

    it('extract file without type - no dot', (done) => {
      extract(path.join(DATA_DIR, `fixture-${type}`), TARGET, { strip: 1, type: type }, (err) => {
        if (err) {
          done(err);
          return;
        }
        verifyExtraction(type, done);
      });
    });

    it('extract file without type - options as type, no strip', (done) => {
      extract(path.join(DATA_DIR, `fixture-${type}`), TARGET, type, (err) => {
        if (err) {
          done(err);
          return;
        }
        if (isArchiveType(type)) {
          verifyArchiveNoStrip(type, done);
        } else {
          const files = fs.readdirSync(TARGET);
          assert.equal(files.length, 1);
          const expectedNames = type === 'js.gz' ? ['fixture.js.gz', 'fixture-js.gz'] : ['fixture.js', 'fixture-js'];
          assert.ok(expectedNames.indexOf(files[0]) >= 0, `expected one of ${expectedNames.join(', ')}, got ${files[0]}`);
          assert.equal(cr(fs.readFileSync(path.join(TARGET, files[0])).toString()), CONTENTS);
          done();
        }
      });
    });

    it('extract file by stream - filename', (done) => {
      const stream = fs.createReadStream(path.join(DATA_DIR, `fixture-${type}`));
      (stream as SpecifiedStream).filename = `fixture.${type}`;
      extract(stream, TARGET, { strip: 1 }, (err) => {
        if (err) {
          done(err);
          return;
        }
        verifyExtraction(type, done);
      });
    });

    it('extract file by stream - basename', (done) => {
      const stream = fs.createReadStream(path.join(DATA_DIR, `fixture-${type}`));
      (stream as SpecifiedStream).basename = `fixture.${type}`;
      extract(stream, TARGET, { strip: 1 }, (err) => {
        if (err) {
          done(err);
          return;
        }
        verifyExtraction(type, done);
      });
    });
  });
}

describe('extensions', () => {
  beforeEach((callback) => {
    safeRm(TMP_DIR, () => {
      mkdirp(TMP_DIR, callback);
    });
  });

  for (let index = 0; index < EXTRACT_TYPES.length; index++) addTests(EXTRACT_TYPES[index]);
});
