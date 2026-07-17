import { describe, expect, test } from "bun:test";
import type {
  ThreadChunkElement,
  ThreadPostState,
} from "../../../entities/thread/types";
import { mergeThreadPosts } from "./threadPosts";

function makeElement(seq: number): ThreadChunkElement {
  return {
    id: `post-${seq}`,
    seq,
    body: `本文 ${seq}`,
    createdAt: new Date(0).toISOString(),
    displayId: null,
    attachment: null,
  };
}

function makeState(
  seq: number,
  up: number,
  status: ThreadPostState["status"] = "public",
): ThreadPostState {
  return { seq, status, reactions: { up, del: 0 } };
}

describe("mergeThreadPosts", () => {
  test("1000レスのstate更新で変更されたseqだけ参照を置き換える", () => {
    const elements = Array.from({ length: 1000 }, (_, seq) => makeElement(seq));
    const initial = mergeThreadPosts(
      "thread-1",
      elements,
      elements.map((element) => makeState(element.seq, 0)),
    );
    const updated = mergeThreadPosts(
      "thread-1",
      elements,
      elements.map((element) =>
        makeState(element.seq, element.seq === 500 ? 1 : 0),
      ),
      initial,
    );

    expect(updated).not.toBe(initial);
    expect(updated[500]).not.toBe(initial[500]);
    expect(
      updated.filter((post, index) => post !== initial[index]),
    ).toHaveLength(1);
    expect(updated[499]).toBe(initial[499]);
    expect(updated[501]).toBe(initial[501]);
  });

  test("stateの非公開statusは本文と添付を隠す", () => {
    const [post] = mergeThreadPosts(
      "thread-1",
      [makeElement(1)],
      [makeState(1, 0, "shadowed")],
    );

    expect(post?.status).toBe("shadowed");
    expect(post?.body).toBe("");
    expect(post?.attachment).toBeNull();
  });

  test("本文のないplaceholderをpublic stateだけで空投稿へ戻さない", () => {
    const placeholder: ThreadChunkElement = { seq: 1, status: "unavailable" };
    const [post] = mergeThreadPosts(
      "thread-1",
      [placeholder],
      [makeState(1, 0, "public")],
    );

    expect(post?.status).toBe("unavailable");
    expect(post?.body).toBe("");
  });

  test("変更がない場合は投稿配列も参照を維持する", () => {
    const elements = [makeElement(0), makeElement(1)];
    const initial = mergeThreadPosts(
      "thread-1",
      elements,
      elements.map((element) => makeState(element.seq, 0)),
    );

    expect(
      mergeThreadPosts(
        "thread-1",
        elements,
        elements.map((element) => makeState(element.seq, 0)),
        initial,
      ),
    ).toBe(initial);
  });
});
