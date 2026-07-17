import { describe, expect, test } from "bun:test";
import {
  getThreadChunkStaleTime,
  THREAD_CHUNK_QUERY_BEHAVIOR,
} from "./threadChunkQuery";

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
});
