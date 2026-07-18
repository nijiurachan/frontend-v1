export type SubmissionLifecycle = {
  begin: () => AbortSignal;
  invalidate: () => void;
  isCurrent: (signal: AbortSignal) => boolean;
  dispose: () => void;
};

export function createSubmissionLifecycle(): SubmissionLifecycle {
  let activeController: AbortController | null = null;
  let isDisposed = false;

  function begin(): AbortSignal {
    if (isDisposed) {
      throw new Error("投稿フォームは既に閉じられています");
    }
    activeController?.abort();
    activeController = new AbortController();
    return activeController.signal;
  }

  function invalidate(): void {
    activeController?.abort();
    activeController = null;
  }

  function isCurrent(signal: AbortSignal): boolean {
    return (
      !isDisposed && !signal.aborted && activeController?.signal === signal
    );
  }

  function dispose(): void {
    isDisposed = true;
    invalidate();
  }

  return { begin, invalidate, isCurrent, dispose };
}
