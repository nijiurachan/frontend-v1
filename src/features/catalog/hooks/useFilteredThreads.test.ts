import { describe, expect, test } from "bun:test";
import type { Thread } from "@/entities/thread";
import { filterCatalogThreads } from "@/features/catalog/hooks/useFilteredThreads";

function makeThread(id: string, body: string): Thread {
  return {
    id,
    opPost: { body },
    tags: [],
  } as Thread;
}

describe("filterCatalogThreads", () => {
  test("filters a thread immediately after the NG predicate changes", () => {
    const threads = [makeThread("visible", "visible body")];

    expect(
      filterCatalogThreads(threads, "", null, () => false, false),
    ).toHaveLength(1);
    expect(
      filterCatalogThreads(threads, "", null, () => true, false),
    ).toHaveLength(0);
  });

  test("keeps an NG thread when NG content display is enabled", () => {
    const threads = [makeThread("ng", "hidden body")];

    expect(filterCatalogThreads(threads, "", null, () => true, true)).toEqual(
      threads,
    );
  });
});
