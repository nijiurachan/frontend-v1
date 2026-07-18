import { describe, expect, test } from "bun:test";
import type { ThreadPostState } from "@/entities/thread/types";
import { getBoardTailChunkNumbers } from "@/features/board/hooks/useBoardThreads";

function state(
  seq: number,
  status: ThreadPostState["status"] = "public",
): ThreadPostState {
  return { seq, status, reactions: { up: 0, del: 0 } };
}

describe("board latest reply chunks", () => {
  test("loads both chunks when the latest eight public replies cross a boundary", () => {
    expect(
      getBoardTailChunkNumbers(
        [0, 98, 99, 100, 101, 102, 103, 104, 105].map((seq) => state(seq)),
      ),
    ).toEqual([0, 1]);
  });

  test("derives every needed chunk from sparse public replies", () => {
    const sparsePublic = [1, 205, 410, 615, 820, 1025, 1230, 1435];
    const unavailableTail = [1498, 1499, 1500].map((seq) =>
      state(seq, "unavailable"),
    );

    expect(
      getBoardTailChunkNumbers([
        ...sparsePublic.map((seq) => state(seq)),
        ...unavailableTail,
      ]),
    ).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
  });

  test("does not fetch a chunk when the thread has no public replies", () => {
    expect(
      getBoardTailChunkNumbers([
        state(0),
        state(1, "trash"),
        state(2, "shadowed"),
      ]),
    ).toEqual([]);
  });
});
