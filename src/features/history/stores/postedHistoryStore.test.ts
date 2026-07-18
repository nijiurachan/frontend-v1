import { beforeEach, describe, expect, test } from "bun:test";

const memoryStorage: Map<string, string> = new Map<string, string>();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: globalThis,
});
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    removeItem: (key: string) => memoryStorage.delete(key),
    setItem: (key: string, value: string) => memoryStorage.set(key, value),
  },
});

const historyModule: typeof import("@/features/history/stores/postedHistoryStore") =
  await import("@/features/history/stores/postedHistoryStore");
const POSTED_HISTORY_MAX_AGE_MS: typeof historyModule.POSTED_HISTORY_MAX_AGE_MS =
  historyModule.POSTED_HISTORY_MAX_AGE_MS;
const migratePostedHistory: typeof historyModule.migratePostedHistory =
  historyModule.migratePostedHistory;
const usePostedHistoryStore: typeof historyModule.usePostedHistoryStore =
  historyModule.usePostedHistoryStore;

describe("posted history retention", () => {
  beforeEach(() => {
    memoryStorage.clear();
    usePostedHistoryStore.setState({ posted: [] });
  });

  test("keeps successful target threads newest-first with a 100 item cap", () => {
    for (let index = 0; index < 105; index += 1) {
      usePostedHistoryStore.getState().addPosted(`thread-${index}`);
    }

    const ids = usePostedHistoryStore.getState().getPostedIds();
    expect(ids).toHaveLength(100);
    expect(ids[0]).toBe("thread-104");
    expect(ids.at(-1)).toBe("thread-5");
  });

  test("drops entries older than 30 days", () => {
    const now = Date.now();
    usePostedHistoryStore.setState({
      posted: [
        { id: "fresh", ts: now },
        { id: "expired", ts: now - POSTED_HISTORY_MAX_AGE_MS - 1 },
      ],
    });

    expect(usePostedHistoryStore.getState().getPostedIds()).toEqual(["fresh"]);
  });

  test("migration drops legacy numeric IDs and keeps current UUIDs", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    expect(
      migratePostedHistory({
        posted: [
          { id: 123, ts: Date.now() },
          { id: uuid, ts: Date.now() },
        ],
      }),
    ).toMatchObject({ posted: [{ id: uuid }] });
  });
});
