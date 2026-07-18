import { describe, expect, test } from "bun:test";
import { getCatalogPath } from "@/features/catalog/hooks/catalogPath";
import type { SortType } from "@/features/catalog/stores/catalogStore";

describe("getCatalogPath", () => {
  test.each([
    "bump",
    "new",
    "old",
    "replies",
    "momentum",
    "soudane",
  ] satisfies SortType[])("requests the global %s sort", (sort) => {
    expect(getCatalogPath(sort, 2, 56)).toBe(
      `/catalog?sort=${sort}&page=2&limit=56`,
    );
  });

  test("normalizes unsafe paging values", () => {
    expect(getCatalogPath("bump", 0, 200)).toBe(
      "/catalog?sort=bump&page=1&limit=100",
    );
  });
});
