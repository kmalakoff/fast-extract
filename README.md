## fast-extract

Extract contents from various archive types (tar, tar.bz2, tar.gz, tar.xz, tgz, zip).

## Install

```sh
npm install fast-extract
```

```javascript
var extract = require('fast-extract')
var source = '/path/file.tar.gz'
var fullPath = '/path/output'

// provide the type
extract(source, fullPath, { strip: 1, type: 'tar.gz' }, function(err) {
  if (err) throw err
  console.log('Extraction complete')
})

```

The callback and promise forms are alternatives. To infer the archive type and overwrite an existing destination with the promise API:

```javascript
extract(source, fullPath, { force: true }).then(function() {
  console.log('Extraction complete')
}).catch(function(err) {
  console.error(err)
})
```

### Safe Extraction

fast-extract uses atomic writes to ensure safe extraction:

1. **Extracts to a temporary location first** - Content is written to a temp path alongside the destination
2. **Removes existing destination** - Only after successful extraction
3. **Atomic rename** - Temp directory is renamed to final destination

This approach ensures you always have either the old content or the new content, never a partial extraction. If the process is interrupted mid-extraction, your destination remains untouched.

### Conservative Overwrite Behavior

Unlike `tar` (which silently overwrites existing files by default), fast-extract requires explicit permission to overwrite:

| Tool | Default Behavior |
|------|------------------|
| `tar` | Silently overwrites existing files |
| `unzip` | Prompts before overwriting |
| `fast-extract` | Fails if destination exists and is non-empty |

To overwrite an existing destination, use the `force` option:

```javascript
extract(source, fullPath, { force: true })
```

This conservative default prevents accidental data loss while still allowing overwrites when explicitly requested.
