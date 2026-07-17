import { describe, expect, test } from "bun:test";
import {
  migrateHistoryState,
  migrateThreadIdArray,
} from "../../../shared/lib/threadIdMigration";

const THREAD_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("persisted thread ID migrations", () => {
  test("history v1 の数値IDを破棄し既読位置を0始まりに直す", () => {
    expect(
      migrateHistoryState(
        {
          viewed: [
            { id: 123, ts: 1, readReplyNumber: 8 },
            { id: THREAD_ID, ts: 2, readReplyNumber: 8 },
          ],
        },
        1,
      ),
    ).toEqual({
      viewed: [{ id: THREAD_ID, ts: 2, readReplyNumber: 7 }],
    });
  });

  test("history v0 はUUIDだけを未読状態で引き継ぐ", () => {
    expect(
      migrateHistoryState(
        {
          viewed: [
            { id: THREAD_ID, ts: 2 },
            { id: 123, ts: 1 },
          ],
        },
        0,
      ),
    ).toEqual({
      viewed: [{ id: THREAD_ID, ts: 2, readReplyNumber: 0 }],
    });
  });

  test("catalog の旧数値IDを破棄して他の設定を保持する", () => {
    expect(
      migrateThreadIdArray(
        { currentSort: "old", lastCatalogIds: [1, THREAD_ID, "invalid"] },
        0,
        1,
        "lastCatalogIds",
      ),
    ).toEqual({ currentSort: "old", lastCatalogIds: [THREAD_ID] });
  });

  test("NG設定の旧数値IDを破棄して他の設定を保持する", () => {
    expect(
      migrateThreadIdArray(
        { ngWords: ["word"], hiddenThreadIds: [1, THREAD_ID, "invalid"] },
        0,
        1,
        "hiddenThreadIds",
      ),
    ).toEqual({ ngWords: ["word"], hiddenThreadIds: [THREAD_ID] });
  });
});
