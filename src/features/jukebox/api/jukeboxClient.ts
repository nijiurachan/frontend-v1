// src/features/jukebox/api/jukeboxClient.ts
import {
  createJukeboxClient,
  type JukeboxVoteResult,
} from "@nijiurachan/js/io/jukebox-api";

const JUKEBOX_BASE_URL: string =
  import.meta.env.VITE_MUSIC_BASE_URL || "https://music.nijiurachan.net";

export const jukeboxClient: ReturnType<typeof createJukeboxClient> =
  createJukeboxClient({ baseUrl: JUKEBOX_BASE_URL });

/**
 * 指定トラックの除外/スキップ投票をトグルする。
 * POST /api/skip/vote へ `{ trackId }` を送り、サーバー側で投票が記録/取消される。
 * @returns voted=投票が記録された / removed=閾値超過で除外・スキップされた
 */
export function vote(trackId: number): Promise<JukeboxVoteResult> {
  return jukeboxClient.vote(trackId);
}

/** 再生履歴の1曲（直近24h）。source は既存 provider と揃えてリテラルユニオン。 */
export interface JukeboxHistoryItem {
  id: number;
  source: "youtube" | "soundcloud";
  mediaId: string;
  title: string | null;
  durationSec: number;
  endedAtMs: number;
}

/** 直近24hの再生履歴を取得する（GET /api/history）。
 *  共有ライブラリの再ピンに依存しないよう、ここで直接 fetch する。
 *  signal は React Query の queryFn コンテキストから受け取り、アンマウント等の
 *  クエリキャンセル時にネットワークリクエストも中断できるようにする。 */
export async function fetchHistory(
  signal?: AbortSignal,
): Promise<JukeboxHistoryItem[]> {
  const res = await fetch(`${JUKEBOX_BASE_URL}/api/history`, {
    credentials: "omit",
    signal,
  });
  if (!res.ok) throw new Error(`history HTTP ${res.status}`);
  const data = (await res.json()) as { history?: unknown };
  // 不正な payload（history が配列でない）は UI の map で落ちる前にここで弾く
  if (!Array.isArray(data?.history)) {
    throw new Error("history: unexpected response shape");
  }
  return data.history as JukeboxHistoryItem[];
}

export const JUKEBOX_STATE_KEY = ["jukebox", "state"] as const;
export const JUKEBOX_HISTORY_KEY = ["jukebox", "history"] as const;
