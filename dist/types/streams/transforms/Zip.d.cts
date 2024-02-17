export = ZipTransform;
declare function ZipTransform(options: any): ZipTransform;
declare class ZipTransform {
    constructor(options: any);
    _transform(chunk: any, _encoding: any, callback: any): void;
    _iterator: any;
    _callback: any;
    _flush(callback: any): any;
    destroy(err: any): void;
}
