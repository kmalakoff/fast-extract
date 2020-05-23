## fast-extract

Extract contents from various archive types (tar, tar.bz2, tar.gz, tar.xz, tgz, zip).

```
var assert = require('assert')
var extract = require('fast-extract'))

// provide the extension
extract('/path/file', fullPath, { strip: 1, extension: 'tar.gz' }, function(err) {})

// use the extension
await extract('/path/file.tar.gz', fullPath, { strip: 1 })
```
