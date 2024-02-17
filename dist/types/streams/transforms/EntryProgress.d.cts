export = EntryProgressTransform;
declare function EntryProgressTransform(options: any): EntryProgressTransform;
declare class EntryProgressTransform {
    constructor(options: any);
    progress: any;
    _transform(entry: any, encoding: any, callback: any): void;
    _flush(callback: any): void;
}
