const STORAGE_KEY = "aimg-turnstile-last-token-usage";

/**
 * フルリロード / 他サイト経由で in-memory の hasSession が失われたあと、
 * 直近の (empty でない) token 使用がこの時間内なら hasSession を復活させる。
 * 旧来のバックエンド session 寿命の目安に合わせた 30 分。
 */
export const SESSION_REVIVAL_WINDOW_MS: number = 30 * 60 * 1000;

/**
 * empty でない token を使った投稿が成功したときに呼ぶ。現在時刻 (epoch ms) を
 * localStorage に記録する。次回フルリロード時の hasSession 復活判定に使う。
 */
export function recordTokenUsage(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // localStorage 不可時 (プライベートブラウズ等) は黙ってスキップ。
    // revival が効かないだけで通常フローには影響しない。
  }
}

/** 直近の token 使用が SESSION_REVIVAL_WINDOW_MS 以内かどうか。 */
export function shouldReviveSession(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return false;
    const last = Number(raw);
    if (!Number.isFinite(last)) return false;
    return Date.now() - last < SESSION_REVIVAL_WINDOW_MS;
  } catch {
    return false;
  }
}
