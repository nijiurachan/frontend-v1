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
});
