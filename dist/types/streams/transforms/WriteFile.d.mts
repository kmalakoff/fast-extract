export default WriteFileTransform;
declare function WriteFileTransform(dest: any, options: any): WriteFileTransform;
declare class WriteFileTransform {
    constructor(dest: any, options: any);
    tempPath: any;
    _transform(chunk: any, encoding: any, callback: any): boolean;
    stream: fs.WriteStream;
    _flush(callback: any): any;
    destroy(err: any): void;
}
import fs from 'fs';
