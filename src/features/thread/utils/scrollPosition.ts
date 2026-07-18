const KEY: string = "aimg_thread_scroll_positions";
const MAX_AGE: number = 24 * 60 * 60 * 1000;
const MAX_COUNT: number = 100;
interface Entry {
  position: number;
  timestamp: number;
}
type Entries = Record<string, Entry>;
function read(storage: Storage): Entries {
  try {
    const value = JSON.parse(storage.getItem(KEY) ?? "{}");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}
function clean(entries: Entries, now: number): Entries {
  return Object.fromEntries(
    Object.entries(entries)
      .filter(
        ([, v]) => Number.isFinite(v.position) && now - v.timestamp < MAX_AGE,
      )
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, MAX_COUNT),
  );
}
function write(storage: Storage, entries: Entries): void {
  try {
    storage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Storage failures must not block navigation or thread teardown.
  }
}
export function restoreThreadScroll(
  storage: Storage,
  threadId: string,
  aliases: Array<string | number> = [],
  now: number = Date.now(),
): number | null {
  const entries = clean(read(storage), now);
  let entry = entries[threadId];
  if (!entry) {
    for (const id of [threadId, ...aliases]) {
      const oldKey = `scroll_pos_${id}`;
      try {
        const legacy = JSON.parse(
          storage.getItem(oldKey) ?? "null",
        ) as Entry | null;
        if (legacy && now - legacy.timestamp < MAX_AGE) {
          entry = legacy;
          storage.removeItem(oldKey);
          break;
        }
      } catch {
        /* corrupt legacy value */
      }
    }
  }
  write(storage, entries);
  if (entry)
    saveThreadScroll(storage, threadId, entry.position, entry.timestamp);
  return entry?.position ?? null;
}
export function saveThreadScroll(
  storage: Storage,
  threadId: string,
  position: number,
  now: number = Date.now(),
): void {
  if (!(position > 0)) return;
  const entries = clean(
    { ...read(storage), [threadId]: { position, timestamp: now } },
    now,
  );
  write(storage, entries);
}
