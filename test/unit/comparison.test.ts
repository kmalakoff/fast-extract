/**
 * Comparison test between native tar and fast-extract
 *
 * This test downloads a real-world tar file (Node.js distribution) and compares
 * the extracted results between system tar and fast-extract to verify they
 * produce identical output.
 *
 * This test also serves as a regression test for the Node 18 flush-write-stream
 * race condition issue.
 */

import assert from 'assert';
import { exec as execCallback } from 'child_process';
import extract from 'fast-extract';
import fs from 'fs';
import Iterator from 'fs-iterator';
import { rmSync } from 'fs-remove-compat';
import getFile from 'get-file-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp');

// Test configuration - use Node 18 distribution for regression testing
const TAR_URL = 'https://nodejs.org/dist/v18.20.8/node-v18.20.8-linux-x64.tar.gz';
const TAR_NAME = 'node-v18.20.8-linux-x64';
const CACHE_DIR = path.join(__dirname, '..', '..', '.cache');
const CACHE_PATH = path.join(CACHE_DIR, `${TAR_NAME}.tar.gz`);
const TAR_EXTRACT_DIR = path.join(TMP_DIR, 'tar');
const FAST_EXTRACT_DIR = path.join(TMP_DIR, 'fast-extract');

/**
 * Interface for file stats collected from directory tree
 */
interface FileStats {
  size: number;
  mode: number;
  mtime: number;
  type: 'directory' | 'file' | 'symlink' | 'other';
}

/**
 * Collect file stats from a directory tree
 * Returns a map of relative paths to their FileStats
 */
function collectStats(dirPath: string, callback: (err: Error | null, stats?: Record<string, FileStats>) => void): void {
  const stats: Record<string, FileStats> = {};

  const iterator = new Iterator(dirPath, { alwaysStat: true, lstat: true });

  iterator.forEach(
    (entry): undefined => {
      // entry.path is already relative to dirPath
      stats[entry.path] = {
        size: entry.stats.size,
        mode: entry.stats.mode,
        mtime: entry.stats.mtime instanceof Date ? entry.stats.mtime.getTime() : 0,
        type: entry.stats.isDirectory() ? 'directory' : entry.stats.isFile() ? 'file' : entry.stats.isSymbolicLink() ? 'symlink' : 'other',
      };
    },
    { concurrency: 1024 },
    (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null, stats);
      }
    }
  );
}

/**
 * Remove directory if it exists
 */
function removeDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    rmSync(dirPath, { recursive: true, force: true });
  }
}

describe('Comparison - fast-extract vs native tar', function () {
  this.timeout(120000); // Allow time for download and extraction

  before((done) => {
    // Ensure .cache directory exists
    if (!fs.existsSync(CACHE_DIR)) {
      mkdirp.sync(CACHE_DIR);
    }

    // Download tar file if it doesn't exist
    if (!fs.existsSync(CACHE_PATH)) {
      console.log(`Downloading ${TAR_URL}...`);
      getFile(TAR_URL, CACHE_PATH, (err) => {
        if (err) {
          done(err);
          return;
        }
        console.log('Download complete');
        setupExtractions(done);
      });
    } else {
      console.log('Using cached tar file');
      setupExtractions(done);
    }
  });

  function setupExtractions(done: (err?: Error) => void): void {
    // Clean up previous extractions
    removeDir(TAR_EXTRACT_DIR);
    removeDir(FAST_EXTRACT_DIR);

    // Ensure TMP_DIR exists
    if (!fs.existsSync(TMP_DIR)) {
      mkdirp.sync(TMP_DIR);
    }

    // Extract with native tar
    console.log('Extracting with native tar...');
    execCallback(`cd "${TMP_DIR}" && tar -xzf "${CACHE_PATH}"`, (err) => {
      if (err) {
        done(err);
        return;
      }

      // Find the extracted directory (should be node-v18.20.8-linux-x64)
      const tarDir = path.join(TMP_DIR, TAR_NAME);
      assert.ok(fs.existsSync(tarDir), `Native tar should create ${TAR_NAME} directory`);

      // Rename it to TAR_EXTRACT_DIR
      fs.renameSync(tarDir, TAR_EXTRACT_DIR);

      // Extract with fast-extract
      console.log('Extracting with fast-extract...');
      let entryCount = 0;
      let lastEntry = '';
      const progressFn = (info): undefined => {
        entryCount++;
        if (info && info.entry) lastEntry = info.entry.path || info.entry.basename || '';
        if (entryCount % 500 === 0) {
          console.log(`  Progress: ${entryCount} entries extracted, last: ${lastEntry}`);
        }
      };

      // Set a timeout to show where we stopped
      const timeout = setTimeout(() => {
        console.log(`  TIMEOUT: stopped at ${entryCount} entries, last: ${lastEntry}`);
      }, 100000);

      extract(CACHE_PATH, FAST_EXTRACT_DIR, { strip: 1, progress: progressFn }, (err) => {
        clearTimeout(timeout);
        if (err) {
          done(err);
          return;
        }
        console.log(`Both extractions complete (${entryCount} entries)`);
        done();
      });
    });
  }

  it('should produce identical extraction results', (done) => {
    // Collect stats from both directories
    console.log('Collecting stats from native tar extraction...');
    collectStats(TAR_EXTRACT_DIR, (err, statsTar) => {
      if (err) {
        done(err);
        return;
      }

      console.log('Collecting stats from fast-extract extraction...');
      collectStats(FAST_EXTRACT_DIR, (err, statsFastExtract) => {
        if (err) {
          done(err);
          return;
        }

        // Find differences
        const differences: string[] = [];

        // Check for files only in native tar
        for (const filePath in statsTar) {
          if (!(filePath in statsFastExtract)) {
            differences.push(`File exists in native tar but not in fast-extract: ${filePath}`);
          }
        }

        // Check for files only in fast-extract
        for (const filePath in statsFastExtract) {
          if (!(filePath in statsTar)) {
            differences.push(`File exists in fast-extract but not in native tar: ${filePath}`);
          }
        }

        // Check for differences in files that exist in both
        for (const filePath in statsTar) {
          if (filePath in statsFastExtract) {
            const statTar = statsTar[filePath];
            const statFastExtract = statsFastExtract[filePath];

            if (statTar.type !== statFastExtract.type) {
              differences.push(`Type mismatch for ${filePath}: native=${statTar.type}, fast-extract=${statFastExtract.type}`);
            }

            if (statTar.size !== statFastExtract.size) {
              differences.push(`Size mismatch for ${filePath}: native=${statTar.size}, fast-extract=${statFastExtract.size}`);
            }

            // Check mode (permissions), but allow for minor differences due to umask
            // Use Number() to handle BigInt on older Windows Node versions
            const modeDiff = Math.abs(Number(statTar.mode) - Number(statFastExtract.mode));
            if (modeDiff > 0o22) {
              // Allow up to umask differences (typically 0o022)
              differences.push(`Mode mismatch for ${filePath}: native=${statTar.mode.toString(8)}, fast-extract=${statFastExtract.mode.toString(8)}`);
            }
          }
        }

        // Report any differences
        if (differences.length > 0) {
          console.error('\n=== DIFFERENCES FOUND ===');
          for (let i = 0; i < Math.min(differences.length, 20); i++) {
            console.error(differences[i]);
          }
          if (differences.length > 20) {
            console.error(`... and ${differences.length - 20} more differences`);
          }
          console.error('=========================\n');

          done(new Error(`Found ${differences.length} difference(s) between native tar and fast-extract extraction`));
          return;
        }

        console.log(`Compared ${Object.keys(statsTar).length} files - all match`);
        assert.strictEqual(Object.keys(statsTar).length, Object.keys(statsFastExtract).length, 'Should have same number of files');
        done();
      });
    });
  });
});
