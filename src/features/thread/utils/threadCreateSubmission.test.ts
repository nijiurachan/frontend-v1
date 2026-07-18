import { describe, expect, test } from "bun:test";
import { prepareThreadCreateAttachment } from "@/features/thread/utils/threadCreateSubmission";

function formWithPreparation(preparing?: Promise<void>): HTMLFormElement {
  return {
    dispatchEvent: (event: Event): boolean => {
      (event as CustomEvent<{ preparing?: Promise<void> }>).detail.preparing =
        preparing;
      return true;
    },
  } as HTMLFormElement;
}

describe("prepareThreadCreateAttachment", () => {
  test("準備フックのrejectを呼び出し元へ返し添付読取を実行しない", async () => {
    let read = false;
    const preparationError = new Error("drawing conversion failed");

    await expect(
      prepareThreadCreateAttachment(
        formWithPreparation(Promise.reject(preparationError)),
        () => {
          read = true;
          return null;
        },
      ),
    ).rejects.toBe(preparationError);
    expect(read).toBe(false);
  });

  test("準備完了後も画像が無ければスレ立てを拒否する", async () => {
    await expect(
      prepareThreadCreateAttachment(formWithPreparation(), () => null),
    ).rejects.toThrow("画像を選択してください");
  });
});
