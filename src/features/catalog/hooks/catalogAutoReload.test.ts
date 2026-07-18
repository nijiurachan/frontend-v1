import { describe, expect, test } from "bun:test";
import {
  CATALOG_AUTO_RELOAD_INTERVAL,
  getCatalogRefetchInterval,
} from "@/features/catalog/hooks/useThreads";

describe("catalog auto reload", () => {
  test("defaults to no polling when disabled", () => {
    expect(getCatalogRefetchInterval(false, "visible")).toBe(false);
  });

  test("polls every 60 seconds only while visible", () => {
    expect(getCatalogRefetchInterval(true, "visible")).toBe(
      CATALOG_AUTO_RELOAD_INTERVAL,
    );
    expect(getCatalogRefetchInterval(true, "hidden")).toBe(false);
  });
});
