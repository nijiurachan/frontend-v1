export function getInitialHeaderScrollY(
  scrollSource: Pick<Window, "scrollY"> | undefined = typeof window ===
  "undefined"
    ? undefined
    : window,
): number {
  return scrollSource?.scrollY ?? 0;
}
