const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidThreadId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function filterUuidThreadIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(isUuidThreadId) : [];
}

export function migrateThreadIdArray(
  persisted: unknown,
  version: number,
  targetVersion: number,
  key: string,
): unknown {
  if (version >= targetVersion || !isRecord(persisted)) return persisted;
  return { ...persisted, [key]: filterUuidThreadIds(persisted[key]) };
}

interface PersistedViewedItem {
  id: string;
  ts: number;
  readReplyNumber: number;
}

interface PersistedHistoryState {
  viewed: PersistedViewedItem[];
  [key: string]: unknown;
}

export function migrateHistoryState(
  persisted: unknown,
  version: number,
): unknown {
  if (version >= 2 || !isRecord(persisted)) return persisted;

  const viewed = Array.isArray(persisted.viewed)
    ? persisted.viewed.flatMap((item): PersistedViewedItem[] => {
        if (!isRecord(item) || !isUuidThreadId(item.id)) return [];
        const readReplyNumber =
          version === 1 && isFiniteNumber(item.readReplyNumber)
            ? Math.max(0, Math.trunc(item.readReplyNumber) - 1)
            : 0;
        return [
          {
            id: item.id,
            ts: isFiniteNumber(item.ts) ? item.ts : 0,
            readReplyNumber,
          },
        ];
      })
    : [];

  return { ...persisted, viewed } satisfies PersistedHistoryState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
