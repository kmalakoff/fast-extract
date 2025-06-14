const assert = require('assert');
const fs = require('fs');
const path = require('path');
const rimraf2 = require('rimraf2');
const mkdirp = require('mkdirp-classic');

const extract = require('fast-extract');
const validateFiles = require('../lib/validateFiles.cjs');

const constants = require('../lib/constants.cjs');
const TMP_DIR = constants.TMP_DIR;
const TARGET = constants.TARGET;
const DATA_DIR = constants.DATA_DIR;

describe('extract', () => {
  (() => {
    // patch and restore promise
    const root = typeof global !== 'undefined' ? global : window;
    let rootPromise;
    before(() => {
      rootPromise = root.Promise;
      root.Promise = require('pinkie-promise');
    });
    after(() => {
      root.Promise = rootPromise;
    });
  })();

  beforeEach((callback) => {
    rimraf2(TMP_DIR, { disableGlob: true }, () => {
      mkdirp(TMP_DIR, callback);
    });
  });

  describe('happy path', () => {
    it('extract file with progress', (done) => {
      const progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      const options = { progress: progress };
      extract(path.join(DATA_DIR, 'fixture.js'), TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, 'js', (err) => {
          if (err) {
            done(err.message);
            return;
          }
          assert.ok(progressUpdates.length > 0);
          done();
        });
      });
    });

    it('extract file multiple times', (done) => {
      const options = {};
      extract(path.join(DATA_DIR, 'fixture.js'), TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, 'js', (err) => {
          if (err) {
            done(err.message);
            return;
          }

          extract(path.join(DATA_DIR, 'fixture.js'), TARGET, options, (err) => {
            assert.ok(err);

            extract(path.join(DATA_DIR, 'fixture.js'), TARGET, { force: true, ...options }, (err) => {
              if (err) {
                done(err.message);
                return;
              }

              validateFiles(options, 'js', (err) => {
                if (err) {
                  done(err.message);
                  return;
                }
                done();
              });
            });
          });
        });
      });
    });

    it('extract file with progress - promise', async () => {
      const progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      const options = { progress: progress };
      await extract(path.join(DATA_DIR, 'fixture.js'), TARGET, options);
      await validateFiles(options, 'js');
      assert.ok(progressUpdates.length > 0);
    });

    it('extract tar with progress', (done) => {
      const progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      const options = { strip: 1, progress: progress };
      extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, 'tar', (err) => {
          if (err) {
            done(err.message);
            return;
          }
          assert.equal(progressUpdates.length, 16);
          done();
        });
      });
    });

    it('extract tar multiple times', (done) => {
      const options = { strip: 1 };
      extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, 'tar', (err) => {
          if (err) {
            done(err.message);
            return;
          }

          extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, options, (err) => {
            assert.ok(err);

            extract(path.join(DATA_DIR, 'fixture.tar'), TARGET, { force: true, ...options }, (err) => {
              if (err) {
                done(err.message);
                return;
              }

              validateFiles(options, 'tar', (err) => {
                if (err) {
                  done(err.message);
                  return;
                }
                done();
              });
            });
          });
        });
      });
    });

    it('extract zip with progress', (done) => {
      const progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      const options = { strip: 1, progress: progress };
      extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, 'zip', (err) => {
          if (err) {
            done(err.message);
            return;
          }
          assert.equal(progressUpdates.length, 16);
          done();
        });
      });
    });

    it('extract zip multiple times', (done) => {
      const options = { strip: 1 };
      extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, 'zip', (err) => {
          if (err) {
            done(err.message);
            return;
          }

          extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, options, (err) => {
            assert.ok(err);

            extract(path.join(DATA_DIR, 'fixture.zip'), TARGET, { force: true, ...options }, (err) => {
              if (err) {
                done(err.message);
                return;
              }

              validateFiles(options, 'zip', (err) => {
                if (err) {
                  done(err.message);
                  return;
                }
                done();
              });
            });
          });
        });
      });
    });

    it.skip('extract 7z with progress', (done) => {
      const progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      const options = { strip: 1, progress: progress };
      extract(path.join(DATA_DIR, 'fixture.7z'), TARGET, options, (err) => {
        if (err) {
          done(err.message);
          return;
        }

        validateFiles(options, '7z', (err) => {
          if (err) {
            done(err.message);
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
