import { ApiError } from "../../api/errors";

const API_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  VALIDATION_ERROR:
    "入力内容を確認してください。投稿本文は4000文字以内で入力してください",
  INVALID_REQUEST: "リクエスト内容を確認してください",
  SPAM_REJECTED:
    "スパム判定により投稿を受け付けられませんでした。内容を変更してお試しください",
  ROLE_FORBIDDEN:
    "この操作には参加期間が足りません。参加期間を満たしてからお試しください",
};
const BAD_REQUEST_MESSAGE = "入力内容を確認してください";

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof ApiError && error.code) {
    if (Object.hasOwn(API_ERROR_MESSAGES, error.code)) {
      const mappedMessage = API_ERROR_MESSAGES[error.code];
      if (mappedMessage) return mappedMessage;
    }
  }
  if (error instanceof ApiError && error.status === 400) {
    return BAD_REQUEST_MESSAGE;
  }
  if (
    error instanceof Error &&
    error.message &&
    !/^HTTP \d+$/.test(error.message)
  ) {
    return error.message;
  }
  return fallbackMessage;
}

export function isMissingThreadError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
