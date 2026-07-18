import { describe, expect, test } from "bun:test";
import {
  getCatalogPageLimit,
  migrateCatalogState,
  useCatalogStore,
} from "@/features/catalog/stores/catalogStore";

const THREAD_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("catalog page size", () => {
  test("uses the legacy desktop defaults", () => {
    expect(useCatalogStore.getState()).toMatchObject({
      columns: 7,
      rows: 8,
      textLength: 8,
    });
  });

  test("uses columns times rows and respects the API maximum", () => {
    expect(getCatalogPageLimit(7, 8)).toBe(56);
    expect(getCatalogPageLimit(12, 20)).toBe(100);
  });
});

describe("migrateCatalogState", () => {
  test("keeps old as a global server sort and removes legacy numeric IDs", () => {
    expect(
      migrateCatalogState(
        {
          currentSort: "old",
          lastCatalogIds: [1, THREAD_ID, "invalid"],
        },
        0,
      ),
    ).toEqual({
      currentSort: "old",
      sortDirection: "desc",
      page: 1,
      lastCatalogIds: [THREAD_ID],
    });
  });

  test.each([
    ["default", "desc", "bump"],
    ["created", "desc", "new"],
    ["date", "asc", "old"],
    ["replies", "desc", "replies"],
    ["sodane", "desc", "soudane"],
    ["momentum", "desc", "momentum"],
  ])("legacy sort %s/%s migrates to %s", (legacySort, direction, sort) => {
    expect(
      migrateCatalogState(
        { currentSort: legacySort, sortDirection: direction },
        2,
      ),
    ).toEqual({
      currentSort: sort,
      sortDirection: "desc",
      page: 1,
    });
  });
});
