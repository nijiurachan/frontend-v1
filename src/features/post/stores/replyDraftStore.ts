const REPLY_DRAFT_STORAGE_PREFIX = "aimg-reply-draft:";

function getBrowserStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function getReplyDraftStorageKey(threadId: string): string {
  return `${REPLY_DRAFT_STORAGE_PREFIX}${encodeURIComponent(threadId)}`;
}

export function readReplyDraft(
  threadId: string,
  storage: Storage | undefined = getBrowserStorage(),
): string {
  try {
    return storage?.getItem(getReplyDraftStorageKey(threadId)) ?? "";
  } catch {
    return "";
  }
}

export function saveReplyDraft(
  threadId: string,
  body: string,
  storage: Storage | undefined = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    if (body) {
      storage.setItem(getReplyDraftStorageKey(threadId), body);
    } else {
      storage.removeItem(getReplyDraftStorageKey(threadId));
    }
  } catch {
    // Storage may be unavailable in private browsing or when its quota is full.
  }
}

export function clearReplyDraft(
  threadId: string,
  storage: Storage | undefined = getBrowserStorage(),
): void {
  try {
    storage?.removeItem(getReplyDraftStorageKey(threadId));
  } catch {
    // Draft persistence is best-effort and must not block posting.
  }
}
