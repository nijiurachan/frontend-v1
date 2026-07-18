import { afterEach, describe, expect, test } from "bun:test";
import {
  createReplyInitialComment,
  selectReplyInitialComment,
  selectReplyOpenCount,
  useReplyModalStore,
} from "../../stores/replyModalStore";

afterEach(() => {
  useReplyModalStore.getState().reset();
});

describe("desktop reply parity", () => {
  test("スレ切替時にPC返信パネルの共有状態をresetする", async () => {
    const source = await Bun.file(
      new URL("./DesktopThreadView.tsx", import.meta.url),
    ).text();

    expect(source).toMatch(
      /useEffect\(\(\) => \(\): void => resetReplyPanel\(\), \[resetReplyPanel, threadId\]\)/,
    );
  });

  test("PC表示は親から渡されたthread queryを使い二重取得しない", async () => {
    const source = await Bun.file(
      new URL("./DesktopThreadView.tsx", import.meta.url),
    ).text();

    expect(source).not.toContain("useThread(");
    expect(source).toContain("threadQuery: UseThreadResult");
  });

  test("No返信をPC返信パネルの初期コメントへ反映する", () => {
    const noQuote = createReplyInitialComment({ body: "本文", seq: 42 }, "no");

    useReplyModalStore.getState().open(noQuote);

    const state = useReplyModalStore.getState();
    expect(selectReplyInitialComment(state)).toBe(">No.42\n");
    expect(selectReplyOpenCount(state)).toBe(1);
  });

  test("同じNo返信を再選択してもopenCountで再適用を通知する", () => {
    const noQuote = createReplyInitialComment({ body: "本文", seq: 7 }, "no");

    useReplyModalStore.getState().open(noQuote);
    useReplyModalStore.getState().open(noQuote);

    const state = useReplyModalStore.getState();
    expect(selectReplyInitialComment(state)).toBe(">No.7\n");
    expect(selectReplyOpenCount(state)).toBe(2);
  });
});
