## fast-extract

Extract contents from various archive types (tar, tar.bz2, tar.gz, tar.xz, tgz, zip).

```
var assert = require('assert')
var extract = require('fast-extract'))

// provide the type
extract('/path/file', fullPath, { strip: 1, type: 'tar.gz' }, function(err) {})

// use the type
await extract('/path/file.tar.gz', fullPath, { strip: 1 })
```
