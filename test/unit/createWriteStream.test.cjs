const assert = require('assert');
const fs = require('fs');
const path = require('path');
const rimraf2 = require('rimraf2');
const mkdirp = require('mkdirp-classic');

const { createWriteStream } = require('fast-extract');
const validateFiles = require('../lib/validateFiles.cjs');

const constants = require('../lib/constants.cjs');
const TMP_DIR = constants.TMP_DIR;
const TARGET = constants.TARGET;
const DATA_DIR = constants.DATA_DIR;

describe('createWriteStream', () => {
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

      const options = { basename: 'fixture.js', progress: progress };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) return done(err);
      });
      res.on('finish', () => {
        validateFiles(options, 'js', (err) => {
          if (err) return done(err);
          assert.ok(progressUpdates.length > 0);
          done();
        });
      });
    });

    it('extract file multiple times', (done) => {
      const options = { basename: 'fixture.js' };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) return done(err);
      });
      res.on('finish', () => {
        validateFiles(options, 'js', (err) => {
          if (err) return done(err);

          const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, options));
          res.on('error', (err) => {
            assert.ok(err);

            const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, { force: true, ...options }));
            res.on('error', (err) => {
              if (err) return done(err);
            });
            res.on('finish', () => {
              validateFiles(options, 'js', (err) => {
                if (err) return done(err);
                done();
              });
            });
          });
          res.on('finish', () => {});
        });
      });
    });

    it('extract file with progress - no basename', (done) => {
      const progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      const options = { progress: progress };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.js')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) return done(err);
      });
      res.on('finish', () => {
        validateFiles(options, (err) => {
          if (err) return done(err);
          assert.ok(progressUpdates.length > 0);
          done();
        });
      });
    });

    it('extract tar with progress', (done) => {
      const progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      const options = { type: 'tar', strip: 1, progress: progress };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) return done(err);
      });
      res.on('finish', () => {
        validateFiles(options, 'tar', (err) => {
          if (err) return done(err);
          assert.equal(progressUpdates.length, 16);
          done();
        });
      });
    });

    it('extract tar multiple times', (done) => {
      const options = { type: 'tar', strip: 1 };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) return done(err);
      });
      res.on('finish', () => {
        validateFiles(options, 'tar', (err) => {
          if (err) return done(err);

          const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, options));
          res.on('error', (err) => {
            assert.ok(err);

            const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.tar')).pipe(createWriteStream(TARGET, { force: true, ...options }));
            res.on('error', (err) => {
              if (err) return done(err);
            });
            res.on('finish', () => {
              validateFiles(options, 'tar', (err) => {
                if (err) return done(err);
                done();
              });
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
      function progress(update) {
        progressUpdates.push(update);
      }

      const options = { type: 'zip', strip: 1, progress: progress };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) return done(err);
      });
      res.on('finish', () => {
        validateFiles(options, 'zip', (err) => {
          if (err) return done(err);
          assert.equal(progressUpdates.length, 16);
          done();
        });
      });
    });

    it('extract zip multiple times', (done) => {
      const options = { type: 'zip', strip: 1 };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) return done(err);
      });
      res.on('finish', () => {
        validateFiles(options, 'zip', (err) => {
          if (err) return done(err);

          const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, options));
          res.on('error', (err) => {
            assert.ok(err);

            const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.zip')).pipe(createWriteStream(TARGET, { force: true, ...options }));
            res.on('error', (err) => {
              if (err) return done(err);
            });
            res.on('finish', () => {
              validateFiles(options, 'zip', (err) => {
                if (err) return done(err);
                done();
              });
            });
          });
          res.on('finish', () => {
            assert.ok(false);
          });
        });
      });
    });

    it.skip('extract 7z with progress', (done) => {
      const progressUpdates = [];
      function progress(update) {
        progressUpdates.push(update);
      }

      const options = { type: '7z', strip: 1, progress: progress };
      const res = fs.createReadStream(path.join(DATA_DIR, 'fixture.7z')).pipe(createWriteStream(TARGET, options));
      res.on('error', (err) => {
        if (err) return done(err);
      });
      res.on('finish', () => {
        validateFiles(options, '7z', (err) => {
          if (err) return done(err);
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
