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

export const JUKEBOX_STATE_KEY = ["jukebox", "state"] as const;
