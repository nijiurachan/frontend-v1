import { describe, expect, it } from "vitest";
import type { StateStorage } from "zustand/middleware";
import type { Post } from "@/entities/post";
import {
  createNgStore,
  IMAGE_NG_SIMILARITY_THRESHOLD,
  migrateNgState,
} from "@/features/ng-filter/stores/ngStore";

function encodeBits(bits: string): string {
  const bytes = Array.from({ length: 8 }, (_, index) =>
    Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2),
  );
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function post(ngHash: string): Post {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    threadId: "00000000-0000-4000-8000-000000000002",
    seq: 1,
    boardNo: 1,
    status: "public",
    body: "safe",
    createdAt: "2026-07-18T00:00:00.000Z",
    attachment: {
      id: "00000000-0000-4000-8000-000000000003",
      kind: "image",
      mime: "image/png",
      width: 8,
      height: 8,
      originalUrl: "https://example.invalid/orig",
      thumbnailUrl: "https://example.invalid/thumb",
      ngHash,
    },
    sodaneCount: 0,
    displayId: null,
  };
}

function memoryStorage(
  initialValues: Record<string, string> = {},
): StateStorage {
  const values = new Map(Object.entries(initialValues));
  return {
    getItem: (name: string): string | null => values.get(name) ?? null,
    setItem: (name: string, value: string): void => {
      values.set(name, value);
    },
    removeItem: (name: string): void => {
      values.delete(name);
    },
  };
}

function persistedState(storage: StateStorage): Record<string, unknown> {
  const value = storage.getItem("aimg-ng-settings");
  if (value === null) throw new Error("persisted state is missing");
  return JSON.parse(value) as Record<string, unknown>;
}

describe("image NG store", () => {
  it("uses the legacy 0.95 matching threshold and rejects similar duplicates", () => {
    expect(IMAGE_NG_SIMILARITY_THRESHOLD).toBe(0.95);
    const store = createNgStore(memoryStorage());
    const base = "0".repeat(64);
    const threeDifferent = `${"1".repeat(3)}${"0".repeat(61)}`;
    const fourDifferent = `${"1".repeat(4)}${"0".repeat(60)}`;

    expect(store.getState().addNgImage(encodeBits(base), "fixture")).toEqual({
      success: true,
      message: "画像をNGに追加しました",
    });
    expect(
      store.getState().isPostHidden(post(encodeBits(threeDifferent))),
    ).toBe(true);
    expect(store.getState().isPostHidden(post(encodeBits(fourDifferent)))).toBe(
      false,
    );
    expect(
      store.getState().addNgImage(encodeBits(threeDifferent)),
    ).toMatchObject({
      success: false,
    });
  });

  it("strictly rejects malformed or non-canonical public hashes", () => {
    const store = createNgStore(memoryStorage());
    expect(store.getState().addNgImage("AAAAAAAAAAB")).toMatchObject({
      success: false,
    });
    expect(store.getState().addNgImage("AAAAAAAAAAA=")).toMatchObject({
      success: false,
    });
    expect(store.getState().ngImages).toEqual([]);
  });

  it("migrates existing bit-string entries without losing user data", () => {
    expect(
      migrateNgState({ ngImages: ["0".repeat(64), "invalid"] }, 1),
    ).toMatchObject({
      ngImages: [{ hash: "0".repeat(64), addedAt: 0, note: "" }],
    });
  });

  it("applies immediately and remains active after persisted reload", async () => {
    const storage = memoryStorage();
    const first = createNgStore(storage);
    const hash = encodeBits("0".repeat(64));
    first.getState().addNgImage(hash, "再読込fixture");
    expect(first.getState().isPostHidden(post(hash))).toBe(true);

    const reloaded = createNgStore(storage);
    await reloaded.persist.rehydrate();
    expect(reloaded.getState().ngImages).toEqual([
      {
        hash: "0".repeat(64),
        addedAt: expect.any(Number),
        note: "再読込fixture",
      },
    ]);
    expect(reloaded.getState().isPostHidden(post(hash))).toBe(true);
  });

  it("imports legacy entries with metadata and persists an import marker", async () => {
    const legacyEntry = {
      hash: "0".repeat(64),
      addedAt: 1_724_000_000_000,
      note: "legacy note",
    };
    const legacyValue = JSON.stringify([legacyEntry]);
    const storage = memoryStorage({ futaba_image_ng: legacyValue });
    const store = createNgStore(storage);

    await store.persist.rehydrate();

    expect(store.getState().ngImages).toEqual([legacyEntry]);
    expect(storage.getItem("futaba_image_ng")).toBe(legacyValue);
    expect(persistedState(storage)).toMatchObject({
      state: { legacyImageNgMigrated: true },
    });
  });

  it("preserves new entries and skips exact or 95-percent-similar legacy duplicates", async () => {
    const existingEntry = {
      hash: "0".repeat(64),
      addedAt: 10,
      note: "new entry",
    };
    const similarHash = `${"1".repeat(3)}${"0".repeat(61)}`;
    const uniqueHash = `${"1".repeat(4)}${"0".repeat(60)}`;
    const storage = memoryStorage({
      "aimg-ng-settings": JSON.stringify({
        state: { ngImages: [existingEntry] },
        version: 2,
      }),
      futaba_image_ng: JSON.stringify([
        { ...existingEntry, addedAt: 20, note: "legacy exact" },
        { hash: similarHash, addedAt: 30, note: "legacy similar" },
        { hash: uniqueHash, addedAt: 40, note: "legacy unique" },
      ]),
    });
    const store = createNgStore(storage);

    await store.persist.rehydrate();

    expect(store.getState().ngImages).toEqual([
      existingEntry,
      { hash: uniqueHash, addedAt: 40, note: "legacy unique" },
    ]);
  });

  it("drops malformed legacy entries without breaking hydration", async () => {
    const storage = memoryStorage({
      "aimg-ng-settings": JSON.stringify({
        state: { ngWords: ["keep me"] },
        version: 2,
      }),
      futaba_image_ng: JSON.stringify([
        { hash: "not-a-bit-string", addedAt: 1, note: "invalid hash" },
        { hash: "0".repeat(64), addedAt: "invalid", note: "invalid time" },
        { hash: "1".repeat(64), addedAt: 2, note: 123 },
      ]),
    });
    const store = createNgStore(storage);

    await store.persist.rehydrate();

    expect(store.getState().ngWords).toEqual(["keep me"]);
    expect(store.getState().ngImages).toEqual([]);
    expect(persistedState(storage)).toMatchObject({
      state: { legacyImageNgMigrated: true },
    });
  });

  it("survives malformed legacy JSON and keeps the old value untouched", async () => {
    const legacyValue = "{malformed legacy json";
    const storage = memoryStorage({ futaba_image_ng: legacyValue });
    const store = createNgStore(storage);

    await store.persist.rehydrate();

    expect(store.getState().ngImages).toEqual([]);
    expect(storage.getItem("futaba_image_ng")).toBe(legacyValue);
    expect(persistedState(storage)).toMatchObject({
      state: { legacyImageNgMigrated: true },
    });
  });

  it("does not re-add legacy entries on repeated hydration", async () => {
    const legacyEntry = {
      hash: "0".repeat(64),
      addedAt: 50,
      note: "once",
    };
    const storage = memoryStorage({
      futaba_image_ng: JSON.stringify([legacyEntry]),
    });
    const store = createNgStore(storage);

    await store.persist.rehydrate();
    await store.persist.rehydrate();
    const reloaded = createNgStore(storage);
    await reloaded.persist.rehydrate();

    expect(store.getState().ngImages).toEqual([legacyEntry]);
    expect(reloaded.getState().ngImages).toEqual([legacyEntry]);
  });
});
