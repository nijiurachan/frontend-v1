import { describe, expect, it } from "vitest";
import {
  createPostActionItems,
  type PostActionHandlers,
} from "@/features/thread/ui/postActionItems";

const handlers: PostActionHandlers = {
  onReply: (): void => {},
  onSoudane: (): void => {},
  onDelete: (): void => {},
  onDel: (): void => {},
  onNgBody: (): void => {},
  onNgImage: (): void => {},
  onReport: (): void => {},
  onCloseThread: (): void => {},
};

function labels(isArchived: boolean): string[] {
  return createPostActionItems(
    isArchived,
    { seq: 0, delCount: null, attachment: { ngHash: "AAAAAAAAAAA" } },
    handlers,
  ).map((action) => action.label);
}

describe("createPostActionItems", () => {
  it("ライブスレのメニューには通報を表示しない", () => {
    expect(labels(false)).toEqual([
      "本文返信",
      "No返信",
      "そうだね",
      "削除",
      "本文NG",
      "画像をNG",
      "del",
      "スレを閉じる",
    ]);
    expect(labels(false)).not.toContain("通報");
  });

  it("アーカイブスレのメニューには通報を表示する", () => {
    expect(labels(true)).toEqual(["本文NG", "画像をNG", "通報"]);
  });
});
