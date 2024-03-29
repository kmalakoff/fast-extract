export default TarTransform;
declare function TarTransform(options: any): TarTransform;
declare class TarTransform {
    constructor(options: any);
    _transform(chunk: any, encoding: any, callback: any): boolean;
    _stream: PassThrough;
    _iterator: any;
    _callback: any;
    _flush(callback: any): any;
    destroy(err: any): void;
}
import { PassThrough } from 'stream';
