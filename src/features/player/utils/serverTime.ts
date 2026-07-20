// ============================================================
// features/player/utils/serverTime.ts
// 同時視聴用のサーバー時刻オフセット取得・キャッシュ
// ============================================================
//
// 同期計算は PC のローカル時計（Date.now()）を基準にしているため、
// 視聴者の PC 時計がずれていると同期位置そのものが丸ごとずれる。
// 同時視聴開始時に 1 回だけ外部の正確な時刻を取得し、PC時計との
// 差分（オフセット）をモジュールキャッシュして補正する。
//
// 取得に失敗した場合はオフセット 0（= PC時刻）にフォールバックするため、
// 同期は従来どおり動作する（退行なし）。
//
// 時刻ソース: バックエンドサーバの時刻(epoch)。
// ============================================================

import { apiGet } from "@/shared/api";

const FETCH_TIMEOUT_MS = 5000;

/** serverEpochMs - localEpochMs。null = 未取得（PC時刻を使用） */
let cachedOffsetMs: number | null = null;
/** 取得中の Promise（同時呼び出しを束ねる） */
let inFlight: Promise<void> | null = null;

/** バックエンドの時刻APIのレスポンス */
interface BackendCurrentTimeResponse {
  epoch_ms: number;
}

/**
 * Promiseをタイムアウト付きで実行する。
 *
 * 注意: タイムアウトを迎えてもawaitが終了するだけで、引数の`promise`はキャンセルされず裏で走り続ける。
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("request timed out")), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer != null) clearTimeout(timer);
  }
}

/**
 * サーバー時刻オフセットを 1 回だけ取得してキャッシュする。
 * 取得済みなら即 return。取得中なら同じ Promise を共有する。
 * 失敗時は cachedOffsetMs を null のまま据え置き（次回開始で再試行可能）。
 */
export function primeServerTimeOffset(): Promise<void> {
  if (cachedOffsetMs !== null) return Promise.resolve();
  if (inFlight) return inFlight;

  inFlight = (async (): Promise<void> => {
    try {
      const t0 = Date.now();
      const { epoch_ms: serverEpochMs } = await withTimeout(
        apiGet<BackendCurrentTimeResponse>("/current-time"),
        FETCH_TIMEOUT_MS,
      );
      const t1 = Date.now();

      // ラウンドトリップ遅延を半分で補正（送信〜受信の中点を基準にする）
      const localMid = (t0 + t1) / 2;
      cachedOffsetMs = serverEpochMs - localMid;
    } catch {
      // 取得失敗時は PC時刻にフォールバック（オフセット 0 扱い）。
      // cachedOffsetMs は null のまま据え置き、次回開始時に再試行できる。
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * オフセット補正済みの現在時刻（epoch ms）を返す。
 * 未取得時は PC時刻をそのまま返す。
 */
export function getSyncedNow(): number {
  return Date.now() + (cachedOffsetMs ?? 0);
}
