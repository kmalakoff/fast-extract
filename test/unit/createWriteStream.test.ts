import assert from 'assert';
import cr from 'cr';
import { createWriteStream, type Progress } from 'fast-extract';
import fs from 'fs';
import { safeRm } from 'fs-remove-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
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

function verifyNoBasenameExtraction(callback: (err?: Error) => void) {
  const files = fs.readdirSync(TMP_DIR);
  assert.equal(files.length, 1);
  assert.deepEqual(files.sort(), ['target']);
  assert.equal(cr(fs.readFileSync(path.join(TMP_DIR, files[0])).toString()), CONTENTS);
  callback();
}

function verifyArchiveExtraction(fixtureName: string, callback: (err?: Error) => void) {
  const { expected } = getFixture(fixtureName);
  getStats(
    TARGET,
    (err, stats) => {
      if (err) {
        callback(err);
        return;
      }
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

describe('createWriteStream', () => {
  beforeEach((callback) => {
    safeRm(TMP_DIR, () => {
      mkdirp(TMP_DIR, callback);
    });
  });

  describe('happy path', () => {
    it('extract file with progress', (done) => {
      const progressUpdates = [];
      const progress = (update: Progress): undefined => {
        progressUpdates.push(update);
      };

      const options = { basename: 'fixture.js', progress };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) {
          done(err);
          return;
        }
      });
      res.on('finish', () => {
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
      const options = { basename: 'fixture.js' };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) {
          done(err);
          return;
        }
      });
      res.on('finish', () => {
        verifyFileExtraction((err) => {
          if (err) {
            done(err);
            return;
          }

          const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, options));
          res.on('error', (err) => {
            assert.ok(err);

            const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, { force: true, ...options }));
            res.on('error', (err) => {
              if (err) {
                done(err);
                return;
              }
            });
            res.on('finish', () => {
              verifyFileExtraction(done);
            });
          });
          res.on('finish', () => {});
        });
      });
    });

    it('extract file with progress - no basename', (done) => {
      const progressUpdates = [];
      const progress = (update: Progress): undefined => {
        progressUpdates.push(update);
      };

      const options = { progress };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) {
          done(err);
          return;
        }
      });
      res.on('finish', () => {
        verifyNoBasenameExtraction((err) => {
          if (err) {
            done(err);
            return;
          }
          assert.ok(progressUpdates.length > 0);
          done();
        });
      });
    });

    it('extract tar with progress', (done) => {
      const progressUpdates = [];
      const progress = (update: Progress): undefined => {
        progressUpdates.push(update);
      };

      const options = { type: 'tar', strip: 1, progress };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) {
          done(err);
          return;
        }
      });
      res.on('finish', () => {
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
      const options = { type: 'tar', strip: 1 };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) {
          done(err);
          return;
        }
      });
      res.on('finish', () => {
        verifyArchiveExtraction('fixture.tar', (err) => {
          if (err) {
            done(err);
            return;
          }

          const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, options));
          res.on('error', (err) => {
            assert.ok(err);

            const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, { force: true, ...options }));
            res.on('error', (err) => {
              if (err) {
                done(err);
                return;
              }
            });
            res.on('finish', () => {
              verifyArchiveExtraction('fixture.tar', done);
            });
          });
          res.on('finish', () => {
            assert.ok(false);
          });
        });
      });
    });

    it('extract zip with progress', (done) => {
      const progressUpdates = [];
      const progress = (update: Progress): undefined => {
        progressUpdates.push(update);
      };

      const options = { type: 'zip', strip: 1, progress };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) {
          done(err);
          return;
        }
      });
      res.on('finish', () => {
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
      const options = { type: 'zip', strip: 1 };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) {
          done(err);
          return;
        }
      });
      res.on('finish', () => {
        verifyArchiveExtraction('fixture.zip', (err) => {
          if (err) {
            done(err);
            return;
          }

          const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, options));
          res.on('error', (err) => {
            assert.ok(err);

            const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, { force: true, ...options }));
            res.on('error', (err) => {
              if (err) {
                done(err);
                return;
              }
            });
            res.on('finish', () => {
              verifyArchiveExtraction('fixture.zip', done);
            });
          });
          res.on('finish', () => {
            assert.ok(false);
          });
        });
      });
    });

    it('extract 7z with progress', (done) => {
      const progressUpdates = [];
      const progress = (update: Progress): undefined => {
        progressUpdates.push(update);
      };

      const options = { type: '7z', strip: 1, progress };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.7z')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) {
          done(err);
          return;
        }
      });
      res.on('finish', () => {
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
    it('should fail with too large strip (tar)', (done) => {
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, { type: 'tar', strip: 2 }));
      res.on('error', (err) => {
        assert.ok(!!err);
        done();
      });
      res.on('finish', () => {
        assert.ok(false);
      });
    });

    it('should fail with too large strip (zip)', (done) => {
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, { type: 'zip', strip: 2 }));
      res.on('error', (err) => {
        assert.ok(!!err);
        done();
      });
      res.on('finish', () => {
        assert.ok(false);
      });
    });
  });
});
