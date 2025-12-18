/**
 * Comparison tests between native tools and fast-extract
 *
 * These tests download real-world archives (Node.js distributions) and compare
 * the extracted results between system tools and fast-extract to verify they
 * produce identical output.
 *
 * Tests are skipped if the required native tool is not available.
 */

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
// Use separate directories from other tests to avoid cleanup conflicts
// (extract.test.ts removes .tmp before each test)
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp-comparison');
const CACHE_DIR = path.join(__dirname, '..', '..', '.cache');

// Base URL for Node.js downloads
const NODE_DIST_BASE = 'https://nodejs.org/dist/v24.12.0';

// Test configurations for each archive type
const TEST_CONFIGS = {
  'tar.gz': {
    url: `${NODE_DIST_BASE}/node-v24.12.0-linux-x64.tar.gz`,
    filename: 'node-v24.12.0-linux-x64.tar.gz',
    extractedName: 'node-v24.12.0-linux-x64',
    nativeCmd: (cachePath: string, tmpDir: string) => `cd "${tmpDir}" && tar -xzf "${cachePath}"`,
    checkCmd: 'which tar',
    strip: 1,
    skipModeCheck: false,
  },
  'tar.xz': {
    url: `${NODE_DIST_BASE}/node-v24.12.0-linux-x64.tar.xz`,
    filename: 'node-v24.12.0-linux-x64.tar.xz',
    extractedName: 'node-v24.12.0-linux-x64',
    nativeCmd: (cachePath: string, tmpDir: string) => `cd "${tmpDir}" && tar -xJf "${cachePath}"`,
    checkCmd: 'which tar && which xz',
    strip: 1,
    skipModeCheck: false,
  },
  zip: {
    url: `${NODE_DIST_BASE}/node-v24.12.0-win-arm64.zip`,
    filename: 'node-v24.12.0-win-arm64.zip',
    extractedName: 'node-v24.12.0-win-arm64',
    nativeCmd: (cachePath: string, tmpDir: string) => `cd "${tmpDir}" && unzip -q "${cachePath}"`,
    checkCmd: 'which unzip',
    strip: 1,
    skipModeCheck: false,
  },
  '7z': {
    url: `${NODE_DIST_BASE}/node-v24.12.0-win-arm64.7z`,
    filename: 'node-v24.12.0-win-arm64.7z',
    extractedName: 'node-v24.12.0-win-arm64',
    nativeCmd: (cachePath: string, tmpDir: string, sevenZipCmd?: string) => `cd "${tmpDir}" && ${sevenZipCmd || '7z'} x -y "${cachePath}"`,
    checkCmd: 'which 7zz || which 7z',
    strip: 1,
    // 7z archives from Windows don't preserve Unix permissions - different extractors use different defaults
    skipModeCheck: true,
  },
};

type ArchiveType = keyof typeof TEST_CONFIGS;

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
 * Check if a native tool is available
 */
function checkToolAvailable(checkCmd: string, callback: (available: boolean) => void): void {
  execCallback(checkCmd, (err) => {
    callback(!err);
  });
}

/**
 * Find the available 7z command (7zz or 7z)
 */
function find7zCommand(callback: (cmd: string | null) => void): void {
  execCallback('which 7zz', (err) => {
    if (!err) {
      callback('7zz');
    } else {
      execCallback('which 7z', (err) => {
        callback(err ? null : '7z');
      });
    }
  });
}

/**
 * Collect file stats from a directory tree
 * Returns a map of relative paths to their FileStats
 */
function collectStats(dirPath: string, callback: (err: Error | null, stats?: Record<string, FileStats>) => void): void {
  const stats: Record<string, FileStats> = {};

  const iterator = new Iterator(dirPath, { alwaysStat: true, lstat: true });

  iterator.forEach(
    (entry): void => {
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

/**
 * Download file to cache if not present
 */
function ensureCached(fileUrl: string, cachePath: string, callback: (err?: Error) => void): void {
  if (fs.existsSync(cachePath)) {
    console.log(`    Using cached: ${path.basename(cachePath)}`);
    callback();
    return;
  }

  console.log(`    Downloading: ${fileUrl}...`);
  getFile(fileUrl, cachePath, (err) => {
    if (err) return callback(err);
    console.log('    Download complete');
    callback();
  });
}

/**
 * Compare two directory trees and report differences
 */
function compareExtractions(nativeDir: string, fastExtractDir: string, skipModeCheck: boolean, callback: (err: Error | null, differences?: string[]) => void): void {
  console.log('    Collecting stats from native extraction...');
  collectStats(nativeDir, (err, statsNative) => {
    if (err) return callback(err);

    console.log('    Collecting stats from fast-extract...');
    collectStats(fastExtractDir, (err, statsFastExtract) => {
      if (err) return callback(err);

      const differences: string[] = [];

      // Check for files only in native
      for (const filePath in statsNative) {
        if (!(filePath in statsFastExtract)) {
          differences.push(`File exists in native but not in fast-extract: ${filePath}`);
        }
      }

      // Check for files only in fast-extract
      for (const filePath in statsFastExtract) {
        if (!(filePath in statsNative)) {
          differences.push(`File exists in fast-extract but not in native: ${filePath}`);
        }
      }

      // Check for differences in files that exist in both
      for (const filePath in statsNative) {
        if (filePath in statsFastExtract) {
          const statNative = statsNative[filePath];
          const statFastExtract = statsFastExtract[filePath];

          if (statNative.type !== statFastExtract.type) {
            differences.push(`Type mismatch for ${filePath}: native=${statNative.type}, fast-extract=${statFastExtract.type}`);
          }

          if (statNative.size !== statFastExtract.size) {
            differences.push(`Size mismatch for ${filePath}: native=${statNative.size}, fast-extract=${statFastExtract.size}`);
          }

          // Check mode (permissions), but allow for minor differences due to umask
          // Skip mode check for formats that don't preserve Unix permissions well (e.g., 7z from Windows)
          if (!skipModeCheck) {
            const modeDiff = Math.abs(Number(statNative.mode) - Number(statFastExtract.mode));
            if (modeDiff > 0o22) {
              differences.push(`Mode mismatch for ${filePath}: native=${statNative.mode.toString(8)}, fast-extract=${statFastExtract.mode.toString(8)}`);
            }
          }
        }
      }

      console.log(`    Compared ${Object.keys(statsNative).length} files`);
      callback(null, differences);
    });
  });
}

/**
 * Create a test suite for a specific archive type
 */
function createArchiveTestSuite(archiveType: ArchiveType): void {
  const config = TEST_CONFIGS[archiveType];
  const cachePath = path.join(CACHE_DIR, config.filename);
  const nativeExtractDir = path.join(TMP_DIR, `native-${archiveType}`);
  const fastExtractDir = path.join(TMP_DIR, `fast-extract-${archiveType}`);

  describe(`Comparison - ${archiveType}`, function () {
    this.timeout(300000); // Allow time for download and extraction

    let toolAvailable = false;
    let sevenZipCmd: string | null = null;

    before((done) => {
      // For 7z, find the specific command available (7zz or 7z)
      if (archiveType === '7z') {
        find7zCommand((cmd) => {
          sevenZipCmd = cmd;
          toolAvailable = cmd !== null;
          if (!toolAvailable) {
            console.log(`    Skipping ${archiveType} tests - native 7zz/7z not available`);
            done();
            return;
          }
          proceedWithSetup();
        });
      } else {
        // Check if native tool is available
        checkToolAvailable(config.checkCmd, (available) => {
          toolAvailable = available;
          if (!available) {
            console.log(`    Skipping ${archiveType} tests - native tool not available`);
            done();
            return;
          }
          proceedWithSetup();
        });
      }

      function proceedWithSetup(): void {
        // Ensure directories exist
        if (!fs.existsSync(CACHE_DIR)) {
          mkdirp.sync(CACHE_DIR);
        }
        if (!fs.existsSync(TMP_DIR)) {
          mkdirp.sync(TMP_DIR);
        }

        // Download file if needed
        ensureCached(config.url, cachePath, (err) => {
          if (err) {
            done(err);
            return;
          }

          // Clean up previous extractions
          removeDir(nativeExtractDir);
          removeDir(fastExtractDir);

          // Extract with native tool
          const toolName = archiveType === '7z' ? sevenZipCmd : archiveType;
          console.log(`    Extracting with native ${toolName} tool...`);
          const nativeCmd = config.nativeCmd(cachePath, TMP_DIR, sevenZipCmd || undefined);
          execCallback(nativeCmd, (err) => {
            if (err) {
              done(err);
              return;
            }

            // Find and rename the extracted directory
            const extractedDir = path.join(TMP_DIR, config.extractedName);
            if (fs.existsSync(extractedDir)) {
              fs.renameSync(extractedDir, nativeExtractDir);
            } else {
              done(new Error(`Native extraction did not create expected directory: ${config.extractedName}`));
              return;
            }

            // Extract with fast-extract
            console.log('    Extracting with fast-extract...');
            let entryCount = 0;
            const progressFn = (): void => {
              entryCount++;
              if (entryCount % 500 === 0) {
                console.log(`      Progress: ${entryCount} entries`);
              }
            };

            extract(cachePath, fastExtractDir, { strip: config.strip, progress: progressFn }, (err) => {
              if (err) {
                done(err);
                return;
              }
              console.log(`    Both extractions complete (${entryCount} entries)`);
              done();
            });
          });
        });
      }
    });

    it('should produce identical extraction results', function (done) {
      if (!toolAvailable) {
        this.skip();
        return;
      }

      compareExtractions(nativeExtractDir, fastExtractDir, config.skipModeCheck, (err, differences) => {
        if (err) {
          done(err);
          return;
        }

        if (differences.length > 0) {
          console.error(`\n=== DIFFERENCES FOUND (${archiveType}) ===`);
          for (let i = 0; i < Math.min(differences.length, 20); i++) {
            console.error(differences[i]);
          }
          if (differences.length > 20) {
            console.error(`... and ${differences.length - 20} more differences`);
          }
          console.error('=========================\n');

          done(new Error(`Found ${differences.length} difference(s) in ${archiveType} extraction`));
          return;
        }

        console.log(`    All files match for ${archiveType}`);
        done();
      });
    });

    after(() => {
      // Clean up extraction directories (keep cache)
      removeDir(nativeExtractDir);
      removeDir(fastExtractDir);
    });
  });
}

// Create test suites for each archive type
createArchiveTestSuite('tar.gz');
createArchiveTestSuite('tar.xz');
createArchiveTestSuite('zip');
createArchiveTestSuite('7z');
