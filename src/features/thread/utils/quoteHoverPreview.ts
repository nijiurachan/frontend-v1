import type { Post } from "@/entities/post";

export type QuotePreviewMode = "hidden" | "static" | "interactive";

export function getQuotePreviewMode(
  target: Post | null,
  hasJumpCallback: boolean,
): QuotePreviewMode {
  if (!target || target.status !== "public") return "hidden";
  return hasJumpCallback ? "interactive" : "static";
}

export function clearQuotePreviewCloseTimer(
  timerRef: { current: number | null },
  clearTimer: (timer: number) => void,
): void {
  if (timerRef.current === null) return;
  clearTimer(timerRef.current);
  timerRef.current = null;
}
