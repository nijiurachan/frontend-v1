import { describe, expect, test } from "bun:test";
import type { SortType } from "@/features/catalog/stores/catalogStore";
import {
  getDesktopSortSelection,
  getSortPresentation,
} from "@/features/catalog/utils/catalogSort";

describe("catalog sort presentation", () => {
  test.each([
    ["bump", "カタ"],
    ["new", "新順"],
    ["old", "古順"],
    ["replies", "多順"],
    ["momentum", "勢順"],
    ["soudane", "そ順"],
  ] satisfies Array<[SortType, string]>)("labels %s as %s", (sort, label) => {
    expect(getSortPresentation(sort).label).toBe(label);
    expect(getDesktopSortSelection(sort)).toEqual({
      sort,
      direction: "desc",
    });
  });
});
