export type SubmitErrorNotifier = (message: string) => void;

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (typeof error === "object" &&
      error !== null &&
      Reflect.get(error, "name") === "AbortError")
  );
}

export function notifySubmitError(
  error: unknown,
  notify: SubmitErrorNotifier,
): void {
  if (isAbortError(error)) return;
  notify(error instanceof Error ? error.message : "投稿に失敗しました");
}
