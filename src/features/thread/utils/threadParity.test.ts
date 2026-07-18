import { describe, expect, test } from "bun:test";
import type { ThreadView } from "@/entities/thread";
import { loadMlbSummary } from "@/features/thread/utils/mlbTracker";
import {
  restoreThreadScroll,
  saveThreadScroll,
} from "@/features/thread/utils/scrollPosition";
import { createSelectionQuote } from "@/features/thread/utils/selectionQuote";
import { loadSpeechSettings, speechText } from "@/features/thread/utils/speech";
import {
  createStoredZip,
  createThreadText,
  safeFilename,
} from "@/features/thread/utils/threadExport";
import { createThreadMetadata } from "@/features/thread/utils/threadMetadata";
import {
  initialWheelReloadState,
  recordEdgeWheel,
} from "@/features/thread/utils/wheelReload";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(k: string): string | null {
    return this.data.get(k) ?? null;
  }
  key(i: number): string | null {
    return [...this.data.keys()][i] ?? null;
  }
  removeItem(k: string): void {
    this.data.delete(k);
  }
  setItem(k: string, v: string): void {
    this.data.set(k, v);
  }
}
describe("legacy thread parity utilities", () => {
  test("reloads on the third same-direction edge wheel within 500ms", () => {
    let state = initialWheelReloadState();
    for (const now of [1000, 1200]) {
      const result = recordEdgeWheel(state, 1, true, now);
      state = result.state;
      expect(result.reload).toBe(false);
    }
    expect(recordEdgeWheel(state, 1, true, 1400).reload).toBe(true);
  });
  test("migrates legacy scroll_pos and retains a current position", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "scroll_pos_42",
      JSON.stringify({ position: 321, timestamp: 1000 }),
    );
    expect(restoreThreadScroll(storage, "uuid", [42], 2000)).toBe(321);
    saveThreadScroll(storage, "uuid", 444, 2100);
    expect(restoreThreadScroll(storage, "uuid", [], 2200)).toBe(444);
  });
  test("uses legacy SEO lengths and UUID canonical", () => {
    const metadata = createThreadMetadata(
      `12345678901\n${"a".repeat(90)}`,
      "abc-uuid",
      "https://example.test/old",
    );
    expect(metadata.title).toStartWith("1234567890…");
    expect(metadata.description.endsWith("…")).toBe(true);
    expect(metadata.canonical).toBe("https://example.test/thread/abc-uuid");
  });
  test("quotes selected lines and sanitizes downloads", () => {
    expect(createSelectionQuote("a\n\nb")).toBe(">a\n\n>b\n");
    expect(safeFilename('a/b:c*?"<>|')).toBe("a_b_c______");
  });
  test("bouyomi text removes URLs and limits body to 200 characters", () => {
    expect(speechText(`https://example.test ${"あ".repeat(201)}`)).toBe(
      `${"あ".repeat(200)}...`,
    );
  });
  test("preserves zero volume and migrates the legacy endpoint port", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      "bouyomiSettings",
      JSON.stringify({ endpoint: "http://localhost:50081/Talk", volume: 0 }),
    );
    expect(loadSpeechSettings(storage)).toMatchObject({
      port: 50081,
      volume: 0,
    });
  });
  test("exports only public posts and creates one valid ZIP envelope", async () => {
    const thread = {
      id: "thread",
      posts: [
        { status: "public", seq: 0, boardNo: 28, body: "visible" },
        { status: "trash", seq: 1, boardNo: 29, body: "secret" },
        { status: "public", seq: 2, boardNo: 30, body: "visible2" },
      ],
    } as ThreadView;
    expect(createThreadText(thread)).toContain("No.28");
    expect(createThreadText(thread)).not.toContain("No.29");
    expect(createThreadText(thread)).toContain("No.30");
    const zip = createStoredZip([
      { name: "画像.txt", data: new TextEncoder().encode("body") },
    ]);
    const bytes = new Uint8Array(await zip.arrayBuffer());
    expect(new DataView(bytes.buffer).getUint32(0, true)).toBe(0x04034b50);
    expect(new DataView(bytes.buffer).getUint32(bytes.length - 22, true)).toBe(
      0x06054b50,
    );
  });
  test("renders every José Ramírez at-bat and the season line", async () => {
    const fetcher = (async (input: URL | RequestInfo) => {
      const url = String(input);
      if (url.includes("/schedule?"))
        return Response.json({
          dates: [
            {
              games: [
                {
                  gamePk: 1,
                  status: { abstractGameState: "Preview" },
                },
                {
                  gamePk: 2,
                  status: {
                    abstractGameState: "Live",
                    detailedState: "In Progress",
                  },
                },
              ],
            },
          ],
        });
      if (url.includes("/feed/live"))
        return Response.json({
          liveData: {
            plays: {
              allPlays: [
                {
                  matchup: { batter: { id: 608070 } },
                  result: { event: "Single" },
                },
                { matchup: { batter: { id: 1 } }, result: { event: "Out" } },
                {
                  matchup: { batter: { id: 608070 } },
                  result: { event: "Home Run" },
                },
              ],
            },
          },
        });
      return Response.json({
        stats: [
          {
            splits: [
              { stat: { avg: ".300", homeRuns: 20, rbi: 70, ops: ".900" } },
            ],
          },
        ],
      });
    }) as typeof fetch;
    expect(
      await loadMlbSummary(fetcher, new Date("2026-07-18T12:00:00.000Z")),
    ).toBe(
      "José Ramírez | 第1打席: Single / 第2打席: Home Run / 打率.300 20HR 70打点 OPS.900",
    );
  });
});
