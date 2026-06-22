// src/features/jukebox/hooks/useJukeboxPlayer.ts
//
// 設計方針:
//   - nowPlaying が変わったら playerStore.loadTrack("primary", track) で差し替える
//   - 1 s ごとにドリフトをチェックし |localPos - expected| > 2 s なら requestSeek
//   - expected = playbackOffsetSec(startedAtMs, serverNowMs) + ライブ補外
//   - ライブ補外 = (Date.now() - fetchedAtClientMs) / 1000

import type { JukeboxNowPlaying } from "@nijiurachan/js/pure/jukebox";
import { playbackOffsetSec } from "@nijiurachan/js/pure/jukebox";
import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/features/player/stores/playerStore";

const DRIFT_THRESHOLD_SEC = 2;
const SLOT_ID = "primary" as const;

interface UseJukeboxPlayerOptions {
  nowPlaying: JukeboxNowPlaying | null;
  serverNowMs: number;
  fetchedAtClientMs: number;
}

export function useJukeboxPlayer({
  nowPlaying,
  serverNowMs,
  fetchedAtClientMs,
}: UseJukeboxPlayerOptions): void {
  // nowPlaying の mediaId が変わったタイミングを検知するため ref で保持
  const prevMediaIdRef = useRef<string | null>(null);

  // loadTrack: nowPlaying が切り替わったとき（または初回）に実行
  useEffect((): (() => void) | void => {
    if (!nowPlaying) {
      prevMediaIdRef.current = null;
      return;
    }
    if (nowPlaying.mediaId === prevMediaIdRef.current) return;
    prevMediaIdRef.current = nowPlaying.mediaId;

    if (nowPlaying.source !== "youtube") return; // YouTube のみ対応

    const expectedOffset =
      playbackOffsetSec(nowPlaying.startedAtMs, serverNowMs) +
      (Date.now() - fetchedAtClientMs) / 1000;

    usePlayerStore.getState().loadTrack(SLOT_ID, {
      id: `youtube:${nowPlaying.mediaId}`,
      provider: "youtube",
      providerId: nowPlaying.mediaId,
      title: nowPlaying.title ?? undefined,
      duration: nowPlaying.durationSec,
    });

    // 少し遅延してから seek（YouTubeEmbed が ready になるのを待つ）
    const tid = setTimeout((): void => {
      usePlayerStore
        .getState()
        .requestSeek(SLOT_ID, Math.max(0, expectedOffset));
    }, 800);

    return (): void => clearTimeout(tid);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying?.mediaId, nowPlaying?.startedAtMs, serverNowMs, fetchedAtClientMs, nowPlaying]);

  // ドリフト補正: 1 s インターバルで現在位置と expected を比較
  useEffect((): (() => void) => {
    if (!nowPlaying) return (): void => {};
    if (nowPlaying.source !== "youtube") return (): void => {};

    const id = setInterval((): void => {
      const localPos =
        usePlayerStore.getState().players[SLOT_ID].currentTime ?? 0;
      const expectedOffset =
        playbackOffsetSec(nowPlaying.startedAtMs, serverNowMs) +
        (Date.now() - fetchedAtClientMs) / 1000;

      if (Math.abs(localPos - expectedOffset) > DRIFT_THRESHOLD_SEC) {
        usePlayerStore
          .getState()
          .requestSeek(SLOT_ID, Math.max(0, expectedOffset));
      }
    }, 1_000);

    return (): void => clearInterval(id);
  }, [nowPlaying, serverNowMs, fetchedAtClientMs]);
}
