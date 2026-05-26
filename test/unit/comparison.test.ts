/**
 * Comparison tests between native tools and fast-extract
 *
 * These tests download real-world archives (Node.js distributions) and compare
 * the extracted results between system tools and fast-extract to verify they
 * produce identical output.
 *
 * Tests are skipped if the required native tool is not available.
 */

import { exec as execCallback, execFile } from 'child_process';
import extract from 'fast-extract';
import fs from 'fs';
import Iterator, { type Entry } from 'fs-iterator';
import { rmSync } from 'fs-remove-compat';
import getFile from 'get-file-compat';
import mkdirp from 'mkdirp-classic';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(typeof __filename !== 'undefined' ? __filename : url.fileURLToPath(import.meta.url));
// Use separate directories from other tests to avoid cleanup conflicts
// (extract.test.ts removes .tmp before each test)
const TMP_DIR = path.join(__dirname, '..', '..', '.tmp', 'comparison');
const CACHE_DIR = path.join(__dirname, '..', '..', '.cache');

const isWindows = process.platform === 'win32';

// Base URL for Node.js downloads
const NODE_DIST_BASE = 'https://nodejs.org/dist/v24.12.0';

type ArchiveType = 'tar.gz' | 'tar.xz' | 'zip' | '7z';

type TestConfig = {
  url: string;
  filename: string;
  extractedName: string;
  nativeCmd?: (cachePath: string, tmpDir: string, sevenZipCmd?: string) => string;
  nativeExtract?: (cachePath: string, tmpDir: string, callback: (err?: Error | null) => void) => void;
  checkCmd: string;
  strip: number;
};

// Windows tar.exe lacks lzma/xz support, so on Windows we extract tar.xz with 7z in two steps:
// xz -> tar, then tar -> files. 7z is preinstalled on GitHub Actions Windows runners.
const nativeExtractTarXzWindows = (cachePath: string, tmpDir: string, callback: (err?: Error | null) => void): void => {
  const tarPath = path.join(tmpDir, path.basename(cachePath, '.xz'));
  execFile('7z', ['x', '-y', `-o${tmpDir}`, cachePath], (err) => {
    if (err) return callback(err);
    execFile('7z', ['x', '-y', `-o${tmpDir}`, tarPath], (err) => {
      try {
        fs.unlinkSync(tarPath);
      } catch (_) {}
      callback(err || undefined);
    });
  });
};

// Test configurations for each archive type
const TEST_CONFIGS: Record<ArchiveType, TestConfig> = {
  'tar.gz': {
    url: `${NODE_DIST_BASE}/node-v24.12.0-linux-x64.tar.gz`,
    filename: 'node-v24.12.0-linux-x64.tar.gz',
    extractedName: 'node-v24.12.0-linux-x64',
    nativeCmd: (cachePath: string, tmpDir: string) => `cd "${tmpDir}" && tar -xzf "${cachePath}"`,
    checkCmd: 'which tar',
    strip: 1,
  },
  // Use the Node.js headers tar.xz (~585KB, no POSIX symlinks) so the same real-world
  // archive works on every platform — Linux/macOS use tar -xJf, Windows uses 7z.
  'tar.xz': {
    url: `${NODE_DIST_BASE}/node-v24.12.0-headers.tar.xz`,
    filename: 'node-v24.12.0-headers.tar.xz',
    extractedName: 'node-v24.12.0',
    nativeCmd: isWindows ? undefined : (cachePath: string, tmpDir: string) => `cd "${tmpDir}" && tar -xJf "${cachePath}"`,
    nativeExtract: isWindows ? nativeExtractTarXzWindows : undefined,
    checkCmd: isWindows ? 'where 7z' : 'which tar && which xz',
    strip: 1,
  },
  zip: {
    url: `${NODE_DIST_BASE}/node-v24.12.0-win-arm64.zip`,
    filename: 'node-v24.12.0-win-arm64.zip',
    extractedName: 'node-v24.12.0-win-arm64',
    nativeCmd: (cachePath: string, tmpDir: string) => `cd "${tmpDir}" && unzip -q "${cachePath}"`,
    checkCmd: 'which unzip',
    strip: 1,
  },
  '7z': {
    url: `${NODE_DIST_BASE}/node-v24.12.0-win-arm64.7z`,
    filename: 'node-v24.12.0-win-arm64.7z',
    extractedName: 'node-v24.12.0-win-arm64',
    nativeCmd: (cachePath: string, tmpDir: string, sevenZipCmd?: string) => `cd "${tmpDir}" && ${sevenZipCmd || '7z'} x -y "${cachePath}"`,
    checkCmd: 'which 7zz || which 7z',
    strip: 1,
  },
};

// Windows archives carry no Unix permissions; each native tool picks its own default.
// On macOS both 7zz and 7z use 0o700; on Linux p7zip uses 0o755.
const NATIVE_DIR_MODE = process.platform === 'linux' ? 493 : 448;

const NATIVE_7Z_TOOLS = [
  { command: '7zz', defaultDirMode: NATIVE_DIR_MODE },
  { command: '7z', defaultDirMode: NATIVE_DIR_MODE },
];

type NativeTool = (typeof NATIVE_7Z_TOOLS)[0];

// Directory type bit (0o40000 = 16384)
const S_IFDIR = 16384;

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
 * Find the first available native 7z tool, returning its command and known default dir mode.
 */
function findNative7z(callback: (tool: NativeTool | null) => void): void {
  let i = 0;
  function tryNext(): void {
    if (i >= NATIVE_7Z_TOOLS.length) {
      callback(null);
      return;
    }
    const tool = NATIVE_7Z_TOOLS[i++];
    execCallback(`which ${tool.command}`, (err) => (err ? tryNext() : callback(tool)));
  }
  tryNext();
}

/**
 * Collect file stats from a directory tree
 * Returns a map of relative paths to their FileStats
 */
function collectStats(dirPath: string, callback: (err: Error | null, stats?: Record<string, FileStats>) => void): void {
  const stats: Record<string, FileStats> = {};

  const iterator = new Iterator(dirPath, { alwaysStat: true, lstat: true });

  iterator.forEach(
    (entry: Entry): void => {
      const s = entry.stats as import('fs').Stats;
      stats[entry.path] = {
        size: s.size,
        mode: s.mode,
        mtime: s.mtime instanceof Date ? s.mtime.getTime() : 0,
        type: s.isDirectory() ? 'directory' : s.isFile() ? 'file' : s.isSymbolicLink() ? 'symlink' : 'other',
      };
    },
    { concurrency: 1024 },
    (err) => (err ? callback(err) : callback(null, stats))
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
function ensureCached(fileUrl: string, cachePath: string, callback: (err?: Error | null) => void): void {
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
 * Compare two directory trees and report differences.
 * nativeDirMode: when set, accept the known difference between this native tool's
 * Windows-archive directory default and fast-extract's 0o755 default.
 */
function compareExtractions(nativeDir: string, fastExtractDir: string, nativeDirMode: number | undefined, callback: (err: Error | null, differences?: string[]) => void): void {
  console.log('    Collecting stats from native extraction...');
  collectStats(nativeDir, (err, statsNativeOpt) => {
    if (err) return callback(err);
    const statsNative = statsNativeOpt as Record<string, FileStats>;

    console.log('    Collecting stats from fast-extract...');
    collectStats(fastExtractDir, (err, statsFastExtractOpt) => {
      if (err) return callback(err);
      const statsFastExtract = statsFastExtractOpt as Record<string, FileStats>;

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

          if (Number(statNative.mode) !== Number(statFastExtract.mode)) {
            // For 7z Windows archives: native tools apply a platform-specific default dir mode;
            // fast-extract (via 7z-iterator) uses 0o755. Accept this known difference.
            if (nativeDirMode !== undefined) {
              const nativeDirDefault = S_IFDIR | nativeDirMode;
              const iteratorDirDefault = S_IFDIR | 493; // 7z-iterator DEFAULT_DIR = 0o755
              if (Number(statNative.mode) === nativeDirDefault && Number(statFastExtract.mode) === iteratorDirDefault) {
                continue;
              }
            }
            differences.push(`Mode mismatch for ${filePath}: native=${Number(statNative.mode).toString(8)}, fast-extract=${Number(statFastExtract.mode).toString(8)}`);
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
function listDir(dir: string): string {
  try {
    const names = fs.readdirSync(dir);
    return names.length ? names.join(', ') : '(empty)';
  } catch (err) {
    return `(readdir failed: ${(err as Error).message})`;
  }
}

function describePath(p: string): string {
  try {
    const s = fs.lstatSync(p);
    const kind = s.isDirectory() ? 'directory' : s.isFile() ? 'file' : s.isSymbolicLink() ? 'symlink' : 'other';
    return `${kind} (size=${s.size}, mode=${s.mode.toString(8)})`;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    return code === 'ENOENT' ? 'does not exist' : `lstat failed: ${(err as Error).message}`;
  }
}

function createArchiveTestSuite(archiveType: ArchiveType): void {
  const config = TEST_CONFIGS[archiveType];
  const archivePath = path.join(CACHE_DIR, config.filename);
  const nativeExtractDir = path.join(TMP_DIR, `native-${archiveType}`);
  const fastExtractDir = path.join(TMP_DIR, `fast-extract-${archiveType}`);

  describe(`Comparison - ${archiveType}`, function () {
    this.timeout(300000); // Allow time for download and extraction

    let toolAvailable = false;
    let nativeTool: NativeTool | null = null;

    before((done) => {
      // For 7z, find the specific command available (7zz or 7z) and its default dir mode
      if (archiveType === '7z') {
        findNative7z((tool) => {
          nativeTool = tool;
          toolAvailable = tool !== null;
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
        // Other suites wipe .tmp between runs; recreate cache/temp roots every time.
        mkdirp.sync(CACHE_DIR);
        mkdirp.sync(TMP_DIR);

        ensureCached(config.url, archivePath, (err) => {
          if (err) return done(err);

          // Clean up previous extractions
          removeDir(nativeExtractDir);
          removeDir(fastExtractDir);

          // Extract with native tool
          const sevenZipCmd = nativeTool?.command;
          const toolName = archiveType === '7z' ? sevenZipCmd : archiveType;
          console.log(`    Extracting with native ${toolName} tool...`);

          const doNativeExtract = (callback: (err?: Error | null) => void) => {
            if (config.nativeExtract) {
              config.nativeExtract(archivePath, TMP_DIR, callback);
            } else if (config.nativeCmd) {
              const cmd = config.nativeCmd(archivePath, TMP_DIR, sevenZipCmd);
              execCallback(cmd, (err) => callback(err || undefined));
            }
          };

          doNativeExtract((err) => {
            if (err) return done(err);

            // Find and rename the extracted directory
            const extractedDir = path.join(TMP_DIR, config.extractedName);
            if (fs.existsSync(extractedDir)) {
              fs.renameSync(extractedDir, nativeExtractDir);
            } else {
              done(new Error(`Native extraction did not create expected directory: ${config.extractedName}`));
              return;
            }

            // Diagnostic: log workspace state just before fast-extract runs.
            // Any unexpected entries here may explain temp-suffix collisions / EEXIST mkdir failures.
            console.log(`    [DEBUG ${archiveType}] platform=${process.platform} pid=${process.pid}`);
            console.log(`    [DEBUG ${archiveType}] TMP_DIR=${TMP_DIR}`);
            console.log(`    [DEBUG ${archiveType}] TMP_DIR entries: ${listDir(TMP_DIR)}`);
            console.log(`    [DEBUG ${archiveType}] fastExtractDir=${fastExtractDir} -> ${describePath(fastExtractDir)}`);
            // List any pre-existing temp-suffix siblings (`fast-extract-<type>-<hash>`).
            try {
              const siblings = fs.readdirSync(TMP_DIR).filter((n) => n.startsWith(`fast-extract-${archiveType}-`));
              if (siblings.length) console.log(`    [DEBUG ${archiveType}] pre-existing temp siblings: ${siblings.join(', ')}`);
            } catch (_) {}

            // Extract with fast-extract
            console.log('    Extracting with fast-extract...');
            let entryCount = 0;
            const progressFn = (): void => {
              entryCount++;
              if (entryCount % 500 === 0) {
                console.log(`      Progress: ${entryCount} entries`);
              }
            };

            extract(archivePath, fastExtractDir, { strip: config.strip, progress: progressFn }, (err) => {
              if (err) {
                console.log(`    [DEBUG ${archiveType}] extract failed: ${err.message}`);
                console.log(`    [DEBUG ${archiveType}] TMP_DIR after failure: ${listDir(TMP_DIR)}`);
                const errPath = (err as NodeJS.ErrnoException).path;
                if (errPath) console.log(`    [DEBUG ${archiveType}] error path: ${errPath} -> ${describePath(errPath)}`);
                return done(err);
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

      // Pass the native tool's default dir mode for 7z so the comparison can accept
      // the known difference between that tool's Windows-archive default and fast-extract's 0o755.
      const nativeDirMode = nativeTool?.defaultDirMode;

      compareExtractions(nativeExtractDir, fastExtractDir, nativeDirMode, (err, diffsOpt) => {
        if (err) return done(err);
        const differences = diffsOpt as string[];

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
