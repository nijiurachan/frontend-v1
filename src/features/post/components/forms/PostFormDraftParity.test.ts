import { describe, expect, test } from "bun:test";

describe("PostForm thread draft switching", () => {
  test("threadId変更時に切替先の下書きをstateとrefへ同期する", async () => {
    const source = await Bun.file(
      new URL("./PostForm.tsx", import.meta.url),
    ).text();

    expect(source).toContain(
      "const nextFormData = { comment: readReplyDraft(threadId) };",
    );
    expect(source).toContain("formDataRef.current = nextFormData;");
    expect(source).toContain("setFormData(nextFormData);");
    expect(source).toContain("}, [threadId]);");
  });
});
