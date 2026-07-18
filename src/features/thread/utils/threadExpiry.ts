export interface ThreadLimits {
  activeThreads: number;
  durationHours: number;
  minimumMinutes: number;
}

export function threadDurationHint(limits: ThreadLimits): string {
  return `現在の上限 ${limits.durationHours}時間（最小${limits.minimumMinutes}分、空欄は上限）`;
}

export function validateThreadDuration(
  rawDuration: string,
  maximumHours: number,
  minimumMinutes: number,
): string | null {
  const raw = rawDuration.trim();
  if (raw === "") return null;
  const match = /^(\d+)\s*[:：]\s*(\d+)$/.exec(raw);
  if (!match) return "保持期間はH:M形式で入力してください（例: 8:00）";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    !Number.isSafeInteger(hours) ||
    !Number.isSafeInteger(minutes) ||
    minutes >= 60
  ) {
    return "保持期間はH:M形式で入力してください（分は0〜59）";
  }
  const totalMinutes = hours * 60 + minutes;
  if (totalMinutes < minimumMinutes) {
    return `保持期間は${minimumMinutes}分以上で指定してください`;
  }
  if (totalMinutes > maximumHours * 60) {
    return `保持期間は${maximumHours}時間以内で指定してください`;
  }
  return null;
}

export function formatThreadExpiry(
  expiresAt: string | null | undefined,
  isPermanent: boolean | undefined,
): string {
  if (isPermanent) return "永久スレッド";
  if (!expiresAt) return "期限未設定";
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "期限不明";
  return `期限 ${new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}
