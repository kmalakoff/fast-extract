import fs from 'fs';
export default function getSize(source, options, callback) {
    // options
    if (options.size !== undefined) return callback(null, options.size);
    // path
    if (typeof source === 'string') {
        return fs.stat(source, (err, stats)=>{
            err ? callback(err) : callback(null, stats.size);
        });
    }
    // stream
    if (source) {
        if (source.headers && source.headers['content-length']) return callback(null, +source.headers['content-length']);
        if (source.size) return callback(null, source.size);
    }
    callback();
}
