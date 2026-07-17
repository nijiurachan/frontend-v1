import type { ThreadChunkElement } from "../../../entities/thread";

/**
 * Accepted state.newPosts are provisional snapshots. When the same sequence is
 * later present in a fetched chunk, the canonical chunk element wins.
 */
export function mergeThreadChunkElements(
  acceptedElements: ThreadChunkElement[],
  chunkElements: ThreadChunkElement[],
): ThreadChunkElement[] {
  const bySeq = new Map<number, ThreadChunkElement>();
  for (const element of [...acceptedElements, ...chunkElements]) {
    bySeq.set(element.seq, element);
  }
  return [...bySeq.values()].sort((left, right) => left.seq - right.seq);
}
