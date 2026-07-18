import { describe, expect, test } from "bun:test";
import {
  createFailedThreadChunkRefetchFilters,
  getThreadChunkStaleTime,
  hasCompleteThreadChunkSnapshot,
  resolveThreadQueryError,
  THREAD_CHUNK_QUERY_BEHAVIOR,
} from "@/features/thread/hooks/threadChunkQuery";

describe("thread chunk query behavior", () => {
  test("満杯チャンクは再取得対象にしない", () => {
    expect(getThreadChunkStaleTime(Array.from({ length: 100 }))).toBe(Infinity);
  });

  test("末尾チャンクには短い staleTime を設定する", () => {
    expect(getThreadChunkStaleTime(Array.from({ length: 99 }))).toBe(15_000);
  });

  test("focus復帰では末尾チャンクを再取得しない", () => {
    expect(THREAD_CHUNK_QUERY_BEHAVIOR.refetchOnWindowFocus).toBe(false);
  });

  test("手動更新では対象スレの失敗チャンクだけを再取得する", () => {
    const filters = createFailedThreadChunkRefetchFilters("123");
    const predicate = filters.predicate;

    expect(filters.queryKey).toEqual(["thread", "123", "chunk"]);
    expect(predicate?.({ state: { status: "error" } } as never)).toBe(true);
    expect(predicate?.({ state: { status: "success" } } as never)).toBe(false);
  });

  test("既存表示があるchunk一時失敗は致命エラーにしない", () => {
    const chunkError = new Error("temporary chunk failure");

    expect(resolveThreadQueryError(null, chunkError, false, true)).toBeNull();
    expect(resolveThreadQueryError(null, chunkError, false, false)).toBe(
      chunkError,
    );
  });

  test("chunk 0欠落時は後続chunkが成功しても完全スナップショットにしない", () => {
    expect(
      hasCompleteThreadChunkSnapshot(
        [undefined, [{ seq: 100, status: "unavailable" }]],
        2,
      ),
    ).toBe(false);
    expect(
      hasCompleteThreadChunkSnapshot(
        [[{ seq: 0, status: "unavailable" }], undefined],
        2,
      ),
    ).toBe(false);
  });

  test("chunk 0から必要数が連続してそろった時だけ完全と判定する", () => {
    expect(
      hasCompleteThreadChunkSnapshot(
        [
          [{ seq: 0, status: "unavailable" }],
          [{ seq: 100, status: "unavailable" }],
        ],
        2,
      ),
    ).toBe(true);
  });

  test("useThreadの手動更新とエラー解決へchunk回復処理を配線する", async () => {
    const source = await Bun.file(
      new URL("./useThread.ts", import.meta.url),
    ).text();

    expect(source).toContain("queryClient.refetchQueries(");
    expect(source).toContain("createFailedThreadChunkRefetchFilters(threadId)");
    expect(source).toContain("error: resolveThreadQueryError(");
  });
});
