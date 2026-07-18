// ============================================================
// features/player/hooks/usePlaylistController.ts
// 連続再生（playlist）モードの結線フック — MiniPlayer から呼ぶ
// ============================================================
//
// 役割:
//   1. ブリッジ      — playlist.currentIndex の変化を primary スロットの
//                      currentTrack に反映（loadTrack + play）。
//   2. 自動次送り    — トラック終了（status="ended"）時に次トラックへ進める。
//   3. history 更新  — トラック切替時に lastIndex を最新化。
//
// MiniPlayer は visible 時のみマウントされる＝再生中のみ存在するため、
// playlist の進行制御をここでホストしても取りこぼしは発生しない。
// ============================================================

import { useEffect } from "react";
import { usePlayerStore } from "@/features/player/stores/playerStore";

export function usePlaylistController(): void {
  const mode = usePlayerStore((s) => s.playlist.mode);
  const currentIndex = usePlayerStore((s) => s.playlist.currentIndex);
  const tracks = usePlayerStore((s) => s.playlist.tracks);
  const status = usePlayerStore((s) => s.players.primary.status);

  // ---- ブリッジ: currentIndex → primary スロット ----
  useEffect(() => {
    if (mode !== "playlist") return;
    const track = tracks[currentIndex];
    if (!track) return;

    const s = usePlayerStore.getState();
    const cur = s.players.primary;
    // 同一 id でも、直前トラックが終了(ended)していれば再ロードする。
    // （連続する重複 videoId で次送りが空振りせず再生継続するように）
    if (cur.currentTrack?.id === track.id && cur.status !== "ended") return;

    s.loadTrack("primary", track);
    s.play("primary");

    // history の lastIndex を最新化（queryKey 同一で更新）
    const entry = s.history.find(
      (h) => h.query.queryKey === s.playlist.queryKey,
    );
    if (entry) {
      s.upsertHistory({
        query: entry.query,
        lastIndex: currentIndex,
        lastTime: 0,
      });
    }
  }, [mode, currentIndex, tracks]);

  // ---- 自動次送り: トラック終了時に進める ----
  useEffect(() => {
    if (mode !== "playlist" || status !== "ended") return;

    const s = usePlayerStore.getState();
    const { repeat, tracks: tks } = s.playlist;
    if (tks.length === 0) return;

    // 1曲リピート: 同トラックを頭出しして再生
    if (repeat === "one") {
      s.requestSeek("primary", 0);
      s.play("primary");
      return;
    }

    // それ以外: 次へ。index が動けばブリッジが次トラックをロードする。
    // 末尾 + repeat none では next() が同 index を返し、ブリッジが id 一致で
    // skip するため何もしない＝停止して表示維持となる。
    s.next();
  }, [mode, status]);
}
