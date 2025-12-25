import type { Progress as ProgressBase } from 'progress-stream';
import type { Transform, Writable } from 'stream';

export interface StreamSource extends NodeJS.ReadableStream {
  statusCode?: number;
  headers?: object;
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
  strip?: number;
  progress?: (update: Progress) => void;
  concurrency?: number;
};

export interface OptionsInternal extends Options {
  fullPath?: string;
  source?: Source;
  now?: Date;
  time?: number;
}

export type Callback = (error?: Error) => void;
