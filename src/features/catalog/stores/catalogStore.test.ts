import { describe, expect, test } from "bun:test";
import {
  getNextSortSelection,
  migrateCatalogState,
} from "@/features/catalog/stores/catalogStore";

const THREAD_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("catalog sort selection", () => {
  test("同じsortでは方向だけを反転する", () => {
    expect(getNextSortSelection("date", "desc", "date")).toEqual({
      sort: "date",
      direction: "asc",
    });
    expect(getNextSortSelection("date", "asc", "date")).toEqual({
      sort: "date",
      direction: "desc",
    });
  });

  test("別sortは降順から開始する", () => {
    expect(getNextSortSelection("date", "asc", "sodane")).toEqual({
      sort: "sodane",
      direction: "desc",
    });
  });
});

describe("migrateCatalogState", () => {
  test("旧oldを日付昇順へ移行し、v0のスレッドIDも同時移行する", () => {
    expect(
      migrateCatalogState(
        {
          currentSort: "old",
          lastCatalogIds: [1, THREAD_ID, "invalid"],
        },
        0,
      ),
    ).toEqual({
      currentSort: "date",
      sortDirection: "asc",
      lastCatalogIds: [THREAD_ID],
    });
  });

  test.each([
    ["default", "bump", "desc"],
    ["created", "date", "desc"],
    ["replies", "replies", "desc"],
    ["soudane", "sodane", "desc"],
    ["momentum", "bump", "desc"],
  ])("旧sort %sを%s/%sへ移行する", (legacySort, sort, direction) => {
    expect(migrateCatalogState({ currentSort: legacySort }, 1)).toEqual({
      currentSort: sort,
      sortDirection: direction,
    });
  });

  test("v2の状態は変更しない", () => {
    const persisted = { currentSort: "date", sortDirection: "asc" };
    expect(migrateCatalogState(persisted, 2)).toBe(persisted);
  });
});
