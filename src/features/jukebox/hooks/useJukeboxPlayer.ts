// src/features/jukebox/hooks/useJukeboxPlayer.ts
//
// 設計方針:
//   グローバルプレイヤー（MiniPlayer + useSyncController）を再利用する。
//   nowPlaying が来たら Track.syncStartTime に startedAtMs を設定して
//   subMode="sync" で primary スロットにロードする。
//   サーバー時刻との同期追従は useSyncController（MiniPlayer 内）に完全委譲する。
//
// nowPlaying が null になった場合:
//   MiniPlayer を強制停止せず、最後のトラックをそのままにしておく。
//   （キューが空になった後もユーザーが手動で閉じるまでは再生を継続できる。
//     次の曲が始まれば自動的に上書きされる。）

import type { JukeboxNowPlaying } from "@nijiurachan/js/pure/jukebox";
import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/features/player/stores/playerStore";
import { useSettingsStore } from "@/features/settings/hooks";

interface UseJukeboxPlayerOptions {
  nowPlaying: JukeboxNowPlaying | null;
}

export function useJukeboxPlayer({
  nowPlaying,
}: UseJukeboxPlayerOptions): void {
  // 前回ロード済みのトラック識別子を ref で保持
  // mediaId と startedAtMs の組み合わせで一意に識別する
  const prevTrackKeyRef = useRef<string | null>(null);
  const jukeboxEnabled = useSettingsStore((s) => s.jukeboxEnabled);

  useEffect((): void => {
    // 設定でジュークボックスが無効なら駆動しない（MiniPlayer を自動表示/再生しない）
    if (!jukeboxEnabled) return;
    if (!nowPlaying) {
      // nowPlaying が null になっても強制停止しない
      // 次の曲が来たら上書きされる
      return;
    }

    // YouTube のみ対応（useSyncController が youtube のみ駆動するため）
    if (nowPlaying.source !== "youtube") return;

    // mediaId + startedAtMs で同一曲・同一上映かを判定
    // startedAtMs が変わる（再起動など）場合も再ロードする
    const trackKey = `${nowPlaying.mediaId}:${nowPlaying.startedAtMs}`;
    if (trackKey === prevTrackKeyRef.current) return;
    // 初回ロードか、曲の切り替わりか（prev が null なら初回）
    const isTransition = prevTrackKeyRef.current !== null;
    prevTrackKeyRef.current = trackKey;

    const s = usePlayerStore.getState();
    // 直前のトラックが再生中 or 再生し終えた(ended)状態なら、ユーザーは既に
    // 再生開始済み（= iOS の初回タップで unlock 済み）と判断できる。
    // この場合だけ、曲が切り替わったときに自動で次の曲へ続ける（自動送り）。
    const wasPlaying =
      s.players.primary.status === "playing" ||
      s.players.primary.status === "ended";

    // 1) 先に currentTrack を新トラックへ差し替える。
    //    subMode を "sync" にした瞬間 useSyncController が駆動を始めるため、
    //    sync 有効化より前に currentTrack を更新しておくことで、古い
    //    currentTrack に対して同期制御（seek/再生速度/pause）が走るのを防ぐ。
    s.loadTrack("primary", {
      id: `youtube:${nowPlaying.mediaId}`,
      provider: "youtube",
      providerId: nowPlaying.mediaId,
      title: nowPlaying.title ?? undefined,
      duration: nowPlaying.durationSec,
      syncStartTime: nowPlaying.startedAtMs,
    });

    // 2) subMode を "sync" に設定 → useSyncController が起動条件を満たす。
    s.initFromQuery({
      queryKey: `jukebox:${trackKey}`,
      raw: `https://www.youtube.com/watch?v=${nowPlaying.mediaId}`,
      mode: "single",
      subMode: "sync",
      origin: {
        threadId: "jukebox",
        path: "/jukebox",
        label: "ジュークボックス",
      },
      tracks: [
        {
          id: `youtube:${nowPlaying.mediaId}`,
          provider: "youtube",
          providerId: nowPlaying.mediaId,
          title: nowPlaying.title ?? undefined,
          duration: nowPlaying.durationSec,
          syncStartTime: nowPlaying.startedAtMs,
        },
      ],
    });

    // 3) 自動送り: ユーザーが既に再生中だった曲からの切り替わり(isTransition)なら、
    //    新しい曲も続けて再生する（status を "playing" に）。
    //    初回ロード時(!isTransition)や手動 pause 中(!wasPlaying)は play() を呼ばない。
    //    → ユーザー操作前に play() すると useSyncController が iOS unlock を誤判定し
    //      上映前 pause / 0 秒シークで自動再生が拒否される（review #42）ため、
    //      その不変条件は「初回はユーザー操作待ち」で保ったまま、曲送りだけ自動化する。
    if (isTransition && wasPlaying) {
      s.play("primary");
    }
  }, [nowPlaying, jukeboxEnabled]);
}
