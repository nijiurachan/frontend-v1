import { describe, expect, test } from "bun:test";
import type { Thread } from "@/entities/thread";
import {
  getMobileSortPresentation,
  sortCatalogThreads,
} from "@/features/catalog/utils/catalogSort";

function makeThread(id: string, sodaneCount: number): Thread {
  const createdAt = "2026-07-18T00:00:00.000Z";
  return {
    id,
    replyCount: 0,
    createdAt,
    bumpedAt: createdAt,
    tags: [],
    opPost: {
      id: `post-${id}`,
      threadId: id,
      seq: 0,
      boardNo: null,
      status: "public",
      body: id,
      createdAt,
      attachment: null,
      sodaneCount,
      displayId: null,
    },
  };
}

describe("sortCatalogThreads", () => {
  const threads = [makeThread("a", 3), makeThread("b", 8), makeThread("c", 3)];

  test.each(["bump", "date", "replies"] as const)(
    "%sの昇順は取得順を非破壊で反転する",
    (sort) => {
      const result = sortCatalogThreads(threads, sort, "asc");

      expect(result.map((thread) => thread.id)).toEqual(["c", "b", "a"]);
      expect(threads.map((thread) => thread.id)).toEqual(["a", "b", "c"]);
    },
  );

  test("基本sortの降順も入力とは別の配列で取得順を維持する", () => {
    const result = sortCatalogThreads(threads, "replies", "desc");

    expect(result.map((thread) => thread.id)).toEqual(["a", "b", "c"]);
    expect(result).not.toBe(threads);
  });

  test("そうだね数で両方向に並べ、同数は取得順を維持する", () => {
    expect(
      sortCatalogThreads(threads, "sodane", "desc").map((thread) => thread.id),
    ).toEqual(["b", "a", "c"]);
    expect(
      sortCatalogThreads(threads, "sodane", "asc").map((thread) => thread.id),
    ).toEqual(["a", "c", "b"]);
  });
});

describe("getMobileSortPresentation", () => {
  test("各sortの方向と意味をラベルで表す", () => {
    expect(getMobileSortPresentation("bump", "desc")).toEqual({
      label: "カタ新▽",
      ariaLabel: "カタ新▽: カタログのbump新しい順",
    });
    expect(getMobileSortPresentation("bump", "asc").label).toBe("カタ古△");
    expect(getMobileSortPresentation("date", "desc").label).toBe("新順▽");
    expect(getMobileSortPresentation("date", "asc").label).toBe("古順△");
    expect(getMobileSortPresentation("replies", "desc").label).toBe("多順▽");
    expect(getMobileSortPresentation("replies", "asc").label).toBe("少順△");
    expect(getMobileSortPresentation("sodane", "desc").label).toBe(
      "そうだね多▽",
    );
    expect(getMobileSortPresentation("sodane", "asc").label).toBe(
      "そうだね少△",
    );
  });
});
