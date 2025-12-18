import assert from 'assert';
import cr from 'cr';
import extract, { type Progress } from 'fast-extract';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import Pinkie from 'pinkie-promise';
import { CONTENTS, TARGET, TMP_DIR } from '../lib/constants.ts';
import { DATA_DIR, getFixture } from '../lib/fixtures.ts';
import getStats from '../lib/getStats.ts';

function verifyFileExtraction(callback: (err?: Error) => void) {
  const files = fs.readdirSync(TARGET);
  assert.equal(files.length, 1);
  assert.ok(files[0] === 'fixture.js' || files[0] === 'fixture-js');
  assert.equal(cr(fs.readFileSync(path.join(TARGET, files[0])).toString()), CONTENTS);
  callback();
}

function verifyArchiveExtraction(fixtureName: string, callback: (err?: Error) => void) {
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
}

describe('extract', () => {
  (() => {
    // patch and restore promise
    if (typeof global === 'undefined') return;
    const globalPromise = global.Promise;
    before(() => {
      global.Promise = Pinkie;
    });
    after(() => {
      global.Promise = globalPromise;
    });
  })();

  beforeEach((callback) => {
    safeRm(TMP_DIR, () => {
      mkdirp(TMP_DIR, callback);
    });
  });

  describe('happy path', () => {
    it('extract file with progress', (done) => {
      const progressUpdates = [];
      const progress = (update: Progress): void => {
        progressUpdates.push(update);
      };

      extract(path.join(DATA_DIR, 'fixture.js'), TARGET, { progress }, (err) => {
        if (err) {
          done(err);
          return;
        }
        verifyFileExtraction((err) => {
          if (err) {
            done(err);
            return;
          }
          assert.ok(progressUpdates.length > 0);
          done();
        });
      });
    });

    it('extract file multiple times', (done) => {
      extract(path.join(DATA_DIR, 'fixture.js'), TARGET, {}, (err) => {
        if (err) {
          done(err);
          return;
        }
        verifyFileExtraction((err) => {
          if (err) {
            done(err);
            return;
          }
          extract(path.join(DATA_DIR, 'fixture.js'), TARGET, {}, (err) => {
            assert.ok(err);
            extract(path.join(DATA_DIR, 'fixture.js'), TARGET, { force: true }, (err) => {
              if (err) {
                done(err);
                return;
              }
              verifyFileExtraction(done);
            });
          });
        });
      });
    });

    it('extract file with progress - promise', async () => {
      const progressUpdates = [];
      const progress = (update: Progress): void => {
        progressUpdates.push(update);
      };

      await extract(path.join(DATA_DIR, 'fixture.js'), TARGET, { progress });
      const files = fs.readdirSync(TARGET);
      assert.equal(files.length, 1);
      assert.ok(files[0] === 'fixture.js' || files[0] === 'fixture-js');
      assert.equal(cr(fs.readFileSync(path.join(TARGET, files[0])).toString()), CONTENTS);
      assert.ok(progressUpdates.length > 0);
    });

    it('extract tar with progress', (done) => {
      const progressUpdates = [];
      const progress = (update: Progress): void => {
        progressUpdates.push(update);
      };

      extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { strip: 1, progress }, (err) => {
        if (err) {
          done(err);
          return;
        }
        verifyArchiveExtraction('fixture.tar', (err) => {
          if (err) {
            done(err);
            return;
          }
          assert.equal(progressUpdates.length, 16);
          done();
        });
      });
    });

    it('extract tar multiple times', (done) => {
      extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { strip: 1 }, (err) => {
        if (err) {
          done(err);
          return;
        }
        verifyArchiveExtraction('fixture.tar', (err) => {
          if (err) {
            done(err);
            return;
          }
          extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { strip: 1 }, (err) => {
            assert.ok(err);
            extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { force: true, strip: 1 }, (err) => {
              if (err) {
                done(err);
                return;
              }
              verifyArchiveExtraction('fixture.tar', done);
            });
          });
        });
      });
    });

    it('extract zip with progress', (done) => {
      const progressUpdates = [];
      const progress = (update: Progress): void => {
        progressUpdates.push(update);
      };

      extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, { strip: 1, progress }, (err) => {
        if (err) {
          done(err);
          return;
        }
        verifyArchiveExtraction('fixture.zip', (err) => {
          if (err) {
            done(err);
            return;
          }
          assert.equal(progressUpdates.length, 16);
          done();
        });
      });
    });

    it('extract zip multiple times', (done) => {
      extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, { strip: 1 }, (err) => {
        if (err) {
          done(err);
          return;
        }
        verifyArchiveExtraction('fixture.zip', (err) => {
          if (err) {
            done(err);
            return;
          }
          extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, { strip: 1 }, (err) => {
            assert.ok(err);
            extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, { force: true, strip: 1 }, (err) => {
              if (err) {
                done(err);
                return;
              }
              verifyArchiveExtraction('fixture.zip', done);
            });
          });
        });
      });
    });

    it('extract 7z with progress', (done) => {
      const progressUpdates = [];
      const progress = (update: Progress): void => {
        progressUpdates.push(update);
      };

      extract(path.join(DATA_DIR, 'fixture.7z'), TARGET, { strip: 1, progress }, (err) => {
        if (err) {
          done(err);
          return;
        }
        verifyArchiveExtraction('fixture.7z', (err) => {
          if (err) {
            done(err);
            return;
          }
          assert.equal(progressUpdates.length, 16);
          done();
        });
      });
    });
  });

  describe('unhappy path', () => {
    it('should fail with too large strip (tar) - path', (done) => {
      extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { strip: 2 }, (err) => {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail with too large strip (tar) - path - promise', async () => {
      try {
        await extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { strip: 2 });
        assert.ok(false);
      } catch (err) {
        assert.ok(!!err);
      }
    });

    it('should fail with too large strip (tar) - stream', (done) => {
      extract(fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')), TARGET, { type: 'tar', strip: 2 }, (err) => {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail with too large strip (zip) - path', (done) => {
      extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, { strip: 2 }, (err) => {
        assert.ok(!!err);
        done();
      });
    });

    it('should fail with too large strip (zip) - stream', (done) => {
      extract(fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')), TARGET, { type: 'zip', strip: 2 }, (err) => {
        assert.ok(!!err);
        done();
      });
    });
  });
});
