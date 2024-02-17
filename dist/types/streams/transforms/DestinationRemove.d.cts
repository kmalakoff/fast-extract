export = DestinationRemove;
declare function DestinationRemove(dest: any, options: any): DestinationRemove;
declare class DestinationRemove {
    constructor(dest: any, options: any);
    dest: any;
    _transform(chunk: any, encoding: any, callback: any): any;
    removed: boolean;
}
