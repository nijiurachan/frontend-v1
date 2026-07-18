export function isThreadInitialLoading(
  isActiveQueryLoading: boolean,
  isArchiveView: boolean,
  hasStateData: boolean,
  isChunkLoading: boolean,
): boolean {
  return (
    isActiveQueryLoading || (!isArchiveView && hasStateData && isChunkLoading)
  );
}
