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
