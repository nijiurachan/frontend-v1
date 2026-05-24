import {
  afterAll,
  beforeAll,
  describe,
  expect,
  setSystemTime,
  test,
} from "bun:test";
import type { PostBodyLine } from "@/entities/post";
import {
  decorateLineEnd,
  decoratePostBody,
  decorateTitle,
  isMay10JST,
} from "./may10Suffix";

describe("isMay10JST", () => {
  test("returns true for May 10 JST (UTC May 9 16:00 = JST May 10 01:00)", () => {
    const date = new Date(Date.UTC(2026, 4, 9, 16, 0, 0));
    expect(isMay10JST(date)).toBe(true);
  });

  test("returns true for May 10 23:59 JST (UTC May 10 14:59)", () => {
    const date = new Date(Date.UTC(2026, 4, 10, 14, 59, 0));
    expect(isMay10JST(date)).toBe(true);
  });

  test("returns true for May 10 00:00 UTC (= JST May 10 09:00, mid-day)", () => {
    const date = new Date(Date.UTC(2026, 4, 10, 0, 0, 0));
    expect(isMay10JST(date)).toBe(true);
  });

  test("returns false for May 9 23:59 JST (UTC May 9 14:59)", () => {
    const date = new Date(Date.UTC(2026, 4, 9, 14, 59, 0));
    expect(isMay10JST(date)).toBe(false);
  });

  test("returns false for May 11 00:00 JST (UTC May 10 15:00)", () => {
    const date = new Date(Date.UTC(2026, 4, 10, 15, 0, 0));
    expect(isMay10JST(date)).toBe(false);
  });

  test("returns false for December 10", () => {
    const date = new Date(Date.UTC(2026, 11, 10, 5, 0, 0));
    expect(isMay10JST(date)).toBe(false);
  });

  test("returns false for January 1 (year boundary)", () => {
    const date = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    expect(isMay10JST(date)).toBe(false);
  });
});

describe("decorateLineEnd", () => {
  test("appends 'なんですよ...！' when no trailing punctuation", () => {
    expect(decorateLineEnd("今日いい天気")).toBe("今日いい天気なんですよ...！");
  });

  test("preserves single trailing ！", () => {
    expect(decorateLineEnd("やったぜ！")).toBe("やったぜなんですよ...！");
  });

  test("preserves single trailing ?", () => {
    expect(decorateLineEnd("そう?")).toBe("そうなんですよ...?");
  });

  test("preserves mixed half/full-width !？", () => {
    expect(decorateLineEnd("本当か!？")).toBe("本当かなんですよ...!？");
  });

  test("preserves three trailing ！！！", () => {
    expect(decorateLineEnd("まじで！！！")).toBe("まじでなんですよ...！！！");
  });

  test("preserves repeated ？？？", () => {
    expect(decorateLineEnd("なんで？？？")).toBe("なんでなんですよ...？？？");
  });

  test("appends 'なんですよ...！' when ending with 。 (not in punct set)", () => {
    expect(decorateLineEnd("終わり。")).toBe("終わり。なんですよ...！");
  });

  test("skips when already decorated with なんですよ...！", () => {
    expect(decorateLineEnd("そうなんですよ...！")).toBe("そうなんですよ...！");
  });

  test("skips when already decorated with ですよ・・・！？ variant", () => {
    expect(decorateLineEnd("あれですよ・・・！？")).toBe(
      "あれですよ・・・！？",
    );
  });

  test("skips when ending with ですよ…! (horizontal ellipsis + half-width)", () => {
    expect(decorateLineEnd("最高ですよ…!")).toBe("最高ですよ…!");
  });

  test("skips when ending with ですよ。。。 (period ellipsis)", () => {
    expect(decorateLineEnd("ですよ。。。")).toBe("ですよ。。。");
  });

  test("skips when ending with ですよ．．．！", () => {
    expect(decorateLineEnd("ですよ．．．！")).toBe("ですよ．．．！");
  });
});

const MAY10_JST: Date = new Date(Date.UTC(2026, 4, 10, 0, 0, 0));
const NON_MAY10: Date = new Date(Date.UTC(2026, 5, 1, 0, 0, 0));

describe("decoratePostBody", () => {
  beforeAll(() => {
    setSystemTime(MAY10_JST);
  });
  afterAll(() => {
    setSystemTime();
  });

  test("returns empty array for empty body", () => {
    expect(decoratePostBody([])).toEqual([]);
  });

  test("decorates last line of single-line text body", () => {
    const body: PostBodyLine[] = [{ type: "text", text: "やったぜ！" }];
    const result = decoratePostBody(body);
    expect(result).toEqual([{ type: "text", text: "やったぜなんですよ...！" }]);
  });

  test("decorates only the last non-empty line of multi-line body", () => {
    const body: PostBodyLine[] = [
      { type: "text", text: "1行目" },
      { type: "text", text: "2行目" },
      { type: "text", text: "最後の行?" },
    ];
    const result = decoratePostBody(body);
    expect(result[0]).toEqual({ type: "text", text: "1行目" });
    expect(result[1]).toEqual({ type: "text", text: "2行目" });
    expect(result[2]).toEqual({ type: "text", text: "最後の行なんですよ...?" });
  });

  test("skips trailing empty lines and decorates last non-empty line", () => {
    const body: PostBodyLine[] = [
      { type: "text", text: "あいうえお" },
      { type: "text", text: "" },
      { type: "text", text: "  " },
    ];
    const result = decoratePostBody(body);
    expect(result[0]).toEqual({
      type: "text",
      text: "あいうえおなんですよ...！",
    });
    expect(result[1]).toEqual({ type: "text", text: "" });
    expect(result[2]).toEqual({ type: "text", text: "  " });
  });

  test("returns body untouched when all lines are empty", () => {
    const body: PostBodyLine[] = [
      { type: "text", text: "" },
      { type: "text", text: "   " },
    ];
    expect(decoratePostBody(body)).toEqual(body);
  });

  test("decorates quote line when it is the last line", () => {
    const body: PostBodyLine[] = [
      { type: "text", text: "返信です" },
      { type: "quote", text: "> あれ" },
    ];
    const result = decoratePostBody(body);
    expect(result[1]).toEqual({
      type: "quote",
      text: "> あれなんですよ...！",
    });
  });

  test("skips decoration only when LAST non-empty line is already decorated", () => {
    const body: PostBodyLine[] = [
      { type: "text", text: "そうですよ...！" },
      { type: "text", text: "そして次の話" },
    ];
    const result = decoratePostBody(body);
    expect(result[0]).toEqual({ type: "text", text: "そうですよ...！" });
    expect(result[1]).toEqual({
      type: "text",
      text: "そして次の話なんですよ...！",
    });
  });

  test("skips entire body when last non-empty line is already decorated", () => {
    const body: PostBodyLine[] = [
      { type: "text", text: "前置き" },
      { type: "text", text: "そうですよ...！" },
    ];
    expect(decoratePostBody(body)).toEqual(body);
  });

  test("hardcoded conversion for ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!! single-line body", () => {
    const body: PostBodyLine[] = [{ type: "text", text: "ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!" }];
    const result = decoratePostBody(body);
    expect(result).toEqual([{ type: "text", text: "ｷﾀ━━━━(ﾟ∀ﾟ)━━━━ﾝﾃﾞｽﾖ...!" }]);
  });

  test("returns body untouched when not May 10", () => {
    setSystemTime(NON_MAY10);
    const body: PostBodyLine[] = [{ type: "text", text: "やったぜ！" }];
    expect(decoratePostBody(body)).toEqual(body);
    setSystemTime(MAY10_JST);
  });
});

describe("decorateTitle", () => {
  beforeAll(() => {
    setSystemTime(MAY10_JST);
  });
  afterAll(() => {
    setSystemTime();
  });

  test("returns empty string unchanged", () => {
    expect(decorateTitle("")).toBe("");
  });

  test("returns whitespace-only string unchanged", () => {
    expect(decorateTitle("   ")).toBe("   ");
  });

  test("decorates plain title", () => {
    expect(decorateTitle("雑談")).toBe("雑談なんですよ...！");
  });

  test("preserves trailing punctuation in title", () => {
    expect(decorateTitle("質問！？")).toBe("質問なんですよ...！？");
  });

  test("hardcoded conversion for ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!! title", () => {
    expect(decorateTitle("ｷﾀ━━━━(ﾟ∀ﾟ)━━━━!!")).toBe("ｷﾀ━━━━(ﾟ∀ﾟ)━━━━ﾝﾃﾞｽﾖ...!");
  });

  test("skips when title already decorated", () => {
    expect(decorateTitle("もうですよ・・・！")).toBe("もうですよ・・・！");
  });

  test("returns title unchanged when not May 10", () => {
    setSystemTime(NON_MAY10);
    expect(decorateTitle("雑談")).toBe("雑談");
    setSystemTime(MAY10_JST);
  });
});
