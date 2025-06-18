import type { ReadStream } from 'fs';
import type { Progress as ProgressBase } from 'progress-stream';
import type { Transform, Writable } from 'stream';

export interface StreamResponse extends ReadStream {
  statusCode: number;
  headers: object;
}

export interface StreamSource extends StreamResponse {
  size?: number;
  basename?: string;
  filename?: string;
}

export interface SourceStats {
  size?: number;
  basename?: string;
}

export type Pipeline = Array<Transform | Writable>;

export type Source = StreamSource | string;

export interface Progress extends ProgressBase {
  progress: string;
  basename?: string;
}

export type Options = {
  basename?: string;
  filename?: string;
  size?: number;
  type?: string;
  force?: boolean;
  progress?: (update: Progress) => undefined;
};

export interface OptionsInternal extends Options {
  _tempPaths?: string[];
  fullPath?: string;
  source?: Source;
  now?: Date;
  time?: number;
}

export type Callback = (error?: Error) => undefined;
