import { describe, expect, test } from "bun:test";
import { notifyUpfileSubmitted } from "@/features/otegaki-upfile/lib/attachUpfileImage";

describe("notifyUpfileSubmitted", () => {
  test("clears the host and dispatches the reset event after success", () => {
    const form = new EventTarget();
    let received = 0;
    let cleared = 0;
    form.addEventListener("aimg:submitted", () => {
      received += 1;
    });
    Object.assign(form, {
      querySelector: () => ({
        clickClear: () => {
          cleared += 1;
        },
      }),
    });

    notifyUpfileSubmitted(form as HTMLFormElement);

    expect(cleared).toBe(1);
    expect(received).toBe(1);
  });
});
