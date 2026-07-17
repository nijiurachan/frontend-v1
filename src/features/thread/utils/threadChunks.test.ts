import { describe, expect, test } from "bun:test";
import type { ThreadChunkElement } from "../../../entities/thread";
import { mergeThreadChunkElements } from "./threadChunks";

function chunkPost(seq: number, body: string): ThreadChunkElement {
  return {
    id: `post-${seq}`,
    seq,
    body,
    createdAt: new Date(0).toISOString(),
    attachment: null,
    displayId: null,
  };
}

describe("mergeThreadChunkElements", () => {
  test("同じseqでは後から取得した正規chunkを採用する", () => {
    const accepted = [chunkPost(101, "state snapshot")];
    const canonical = [chunkPost(100, "first"), chunkPost(101, "canonical")];

    expect(mergeThreadChunkElements(accepted, canonical)).toEqual([
      canonical[0],
      canonical[1],
    ]);
  });
});
