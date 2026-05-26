declare module 'signal-exit' {
  type SignalCallback = (signal?: string) => void;
  function onExit(cb: SignalCallback, opts?: { alwaysLast?: boolean }): () => void;
  export = onExit;
}
