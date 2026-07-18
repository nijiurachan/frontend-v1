const THREAD_CREATE_DRAFT_STORAGE_KEY = "aimg-thread-create-draft";

function getBrowserStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function readThreadCreateDraft(
  storage: Storage | undefined = getBrowserStorage(),
): string {
  try {
    return storage?.getItem(THREAD_CREATE_DRAFT_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveThreadCreateDraft(
  body: string,
  storage: Storage | undefined = getBrowserStorage(),
): void {
  if (!storage) return;
  try {
    if (body) {
      storage.setItem(THREAD_CREATE_DRAFT_STORAGE_KEY, body);
    } else {
      storage.removeItem(THREAD_CREATE_DRAFT_STORAGE_KEY);
    }
  } catch {
    // Draft persistence is best-effort and must not block thread creation.
  }
}

export function clearThreadCreateDraft(
  storage: Storage | undefined = getBrowserStorage(),
): void {
  try {
    storage?.removeItem(THREAD_CREATE_DRAFT_STORAGE_KEY);
  } catch {
    // Draft persistence is best-effort and must not block thread creation.
  }
}
