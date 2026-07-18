import { describe, expect, test } from "bun:test";
import { getCatalogPath } from "@/features/catalog/hooks/catalogPath";
import type { SortType } from "@/features/catalog/stores/catalogStore";

describe("getCatalogPath", () => {
  test.each([
    ["bump", "/catalog?sort=bump"],
    ["date", "/catalog?sort=new"],
    ["replies", "/catalog?sort=replies"],
    ["sodane", "/catalog?sort=bump"],
  ] satisfies [SortType, string][])("%s のAPIパスを返す", (sort, path) => {
    expect(getCatalogPath(sort)).toBe(path);
  });

  test("モバイルの日付昇順もnewを要求してフロントで反転する", () => {
    expect(getCatalogPath("date", "asc", "mobile")).toBe("/catalog?sort=new");
  });

  test.each([
    ["bump", "asc", "/catalog?sort=bump"],
    ["date", "desc", "/catalog?sort=new"],
    ["date", "asc", "/catalog?sort=old"],
    ["replies", "asc", "/catalog?sort=replies"],
    ["sodane", "desc", "/catalog?sort=bump"],
  ] satisfies [SortType, "asc" | "desc", string][])(
    "PCの%s/%sは従来API %sを要求する",
    (sort, direction, path) => {
      expect(getCatalogPath(sort, direction, "desktop")).toBe(path);
    },
  );
});
