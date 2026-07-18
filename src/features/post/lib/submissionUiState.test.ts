import { describe, expect, test } from "bun:test";
import {
  createSubmissionUiState,
  isSubmissionInProgress,
  type SubmissionUiState,
  submissionUiReducer,
} from "@/features/post/lib/submissionUiState";

function reduce(
  state: SubmissionUiState,
  ...actions: Parameters<typeof submissionUiReducer>[1][]
): SubmissionUiState {
  return actions.reduce(submissionUiReducer, state);
}

describe("投稿フォームのtransient UI state", () => {
  test("threadId切替で古い送信中表示とdisabled要因を残さない", () => {
    const submitting = reduce(createSubmissionUiState(), { type: "start" });

    expect(isSubmissionInProgress(submitting, false)).toBe(true);

    const switched = submissionUiReducer(submitting, { type: "reset" });

    expect(switched).toEqual(createSubmissionUiState());
    expect(isSubmissionInProgress(switched, false)).toBe(false);
  });

  test.each([
    ["成功表示", [{ type: "start" as const }, { type: "success" as const }]],
    [
      "失敗表示",
      [
        { type: "start" as const },
        { type: "failure" as const, message: "投稿に失敗しました" },
      ],
    ],
  ])("close/reopenでstaleな%sを消す", (_label, actions) => {
    const beforeClose = reduce(createSubmissionUiState(), ...actions);
    const afterClose = submissionUiReducer(beforeClose, { type: "reset" });

    expect(afterClose).toEqual(createSubmissionUiState());
  });
});
