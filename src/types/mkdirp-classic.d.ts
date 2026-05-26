declare module 'mkdirp-classic' {
  function mkdirp(path: string, callback: (err: Error | null) => void): void;
  namespace mkdirp {
    function sync(path: string): void;
  }
  export = mkdirp;
}
