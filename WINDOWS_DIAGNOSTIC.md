# Windows CI Intermittent Failure Diagnosis

## Problem Summary

Intermittent test failures occurring ONLY on:
- **Platform:** Windows (GitHub Actions)
- **Node version:** Node 16.x specifically
- **Frequency:** Intermittent (most runs pass, occasional failures)

## Observed Failures

| Test | Error | Missing Path |
|------|-------|--------------|
| extract zip with progress | ENOENT | `.tmp\target\dir1\fixture.js` |
| extract zip with progress | AssertionError | expected 3 dirs, got 2 |
| extract tar multiple times | ENOENT | `.tmp\target\dir1\link1` |

All failures occur during **verification** after extraction completes - the extraction callback fires, but when we iterate the extracted directory, files/dirs are missing.

## Repository Setup

```bash
git clone https://github.com/kmalakoff/fast-extract.git
cd fast-extract
npm install
```

## Reproduction Steps

The failures are intermittent. To reproduce, run tests in a loop:

```powershell
# PowerShell - run tests multiple times
for ($i=1; $i -le 20; $i++) {
    Write-Host "=== Run $i ===" -ForegroundColor Cyan
    npm test 2>&1 | Select-String -Pattern "(passing|failing|ENOENT|expected.*dirs)"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILURE on run $i" -ForegroundColor Red
        break
    }
}
```

Or run specific failing tests repeatedly:

```bash
# Run just the archive extraction tests
npx mocha --no-timeouts test/unit/extract.test.ts test/unit/createWriteStream.test.ts
```

## Key Code Paths to Investigate

### 1. Entry extraction: `src/streams/write/entries.ts`

```typescript
function flush(callback) {
  const queue = new Queue(1);
  queue.defer((cb) => {
    safeRm(dest, cb);           // Step 1: Remove existing dest
  });
  queue.defer((cb) => {
    fs.rename(tempDest, dest, cb);  // Step 2: Rename temp to dest
  });
  // Step 3: Create symlinks in dest
  for (const entry of links) {
    queue.defer((cb) => entry.create(dest, options, cb));
  }
  queue.await(callback);        // Step 4: Signal completion
}
```

### 2. Test verification: `test/lib/getStats.ts`

Uses `fs-iterator` to walk the directory and count dirs/files/links.

### 3. Test cleanup: `beforeEach` in test files

```typescript
beforeEach((callback) => {
  safeRm(TMP_DIR, () => {
    mkdirp(TMP_DIR, callback);
  });
});
```

## Diagnostic Tasks

### Task 1: Confirm reproduction

Run the test suite multiple times and confirm you can reproduce the failure. Record:
- Which test failed
- Exact error message
- How many runs before failure

### Task 2: Add diagnostic logging

Modify `src/streams/write/entries.ts` temporarily:

```typescript
function flush(callback) {
  const queue = new Queue(1);
  queue.defer((cb) => {
    console.log('[DIAG] flush: removing dest:', dest);
    safeRm(dest, (err) => {
      console.log('[DIAG] flush: safeRm complete, err:', err);
      cb(err);
    });
  });
  queue.defer((cb) => {
    console.log('[DIAG] flush: renaming', tempDest, '->', dest);
    fs.rename(tempDest, dest, (err) => {
      console.log('[DIAG] flush: rename complete, err:', err);
      if (!err) {
        try {
          const contents = fs.readdirSync(dest);
          console.log('[DIAG] flush: dest contents after rename:', contents);
        } catch (e) {
          console.log('[DIAG] flush: readdirSync failed:', e.message);
        }
      }
      cb(err);
    });
  });
  console.log('[DIAG] flush: links to create:', links.length);
  for (let index = 0; index < links.length; index++) {
    const entry = links[index];
    queue.defer((cb) => {
      console.log('[DIAG] flush: creating link:', entry.path);
      entry.create(dest, options, (err) => {
        console.log('[DIAG] flush: link created, err:', err);
        cb(err);
      });
    });
  }
  queue.await((err) => {
    console.log('[DIAG] flush: complete, calling callback, err:', err);
    callback(err);
  });
}
```

Also modify `test/lib/getStats.ts`:

```typescript
export default function getStats(dir, callback, onFile) {
  console.log('[DIAG] getStats: starting iteration of:', dir);
  try {
    const immediate = fs.readdirSync(dir);
    console.log('[DIAG] getStats: immediate readdirSync:', immediate);
  } catch (e) {
    console.log('[DIAG] getStats: immediate readdirSync failed:', e.message);
  }
  // ... rest of function
}
```

### Task 3: Check timing

Add timestamps to see if there's a timing gap:

```typescript
const start = Date.now();
// ... operation ...
console.log('[DIAG] operation took:', Date.now() - start, 'ms');
```

### Task 4: Check Node 16 vs Node 18+

If you have nvm, test both:

```powershell
nvm use 16
npm test

nvm use 18
npm test
```

Does Node 18 ever fail?

### Task 5: Check fs.rename behavior

Create a minimal test case:

```javascript
const fs = require('fs');
const path = require('path');

const tmp = path.join(__dirname, 'test-tmp');
const dest = path.join(__dirname, 'test-dest');

// Setup
fs.mkdirSync(tmp, { recursive: true });
fs.writeFileSync(path.join(tmp, 'file.txt'), 'hello');
fs.mkdirSync(path.join(tmp, 'subdir'));
fs.writeFileSync(path.join(tmp, 'subdir', 'nested.txt'), 'world');

// Rename and immediately read
fs.rename(tmp, dest, (err) => {
  console.log('rename callback, err:', err);
  console.log('readdirSync(dest):', fs.readdirSync(dest));
  console.log('readdirSync(dest/subdir):', fs.readdirSync(path.join(dest, 'subdir')));

  // Cleanup
  fs.rmSync(dest, { recursive: true });
});
```

Run this in a loop and see if it ever fails.

## Questions to Answer

1. Can you reproduce the failure? How many runs does it take?
2. When it fails, what does the diagnostic logging show?
3. Does the failure happen during rename, link creation, or verification?
4. Does Node 18+ have the same issue?
5. Is there anything in the Windows filesystem (antivirus, indexing) that could interfere?

## Expected Output

Please provide:
1. Your Windows version and Node version
2. Number of test runs attempted
3. Failure reproduction rate (e.g., "failed 2 out of 20 runs")
4. Full diagnostic output from a failing run
5. Any patterns you notice
