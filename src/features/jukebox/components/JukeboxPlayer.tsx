// src/features/jukebox/components/JukeboxPlayer.tsx
//
// キュー管理 UI。動画再生はグローバル MiniPlayer に委譲する。
// useJukeboxPlayer が nowPlaying を監視し、変化があれば playerStore 経由で
// MiniPlayer をドライブする。同期追従は MiniPlayer 内の useSyncController に委譲。

import { useState } from "react";
import { useCancelMine } from "@/features/jukebox/hooks/useCancelMine";
import { useEnqueue } from "@/features/jukebox/hooks/useEnqueue";
import { useJukeboxPlayer } from "@/features/jukebox/hooks/useJukeboxPlayer";
import { useJukeboxState } from "@/features/jukebox/hooks/useJukeboxState";
import { usePresenceHeartbeat } from "@/features/jukebox/hooks/usePresenceHeartbeat";
import { useSkipVote } from "@/features/jukebox/hooks/useSkipVote";
import { AddSongForm } from "@/features/jukebox/ui/AddSongForm";
import { ListenerCount } from "@/features/jukebox/ui/ListenerCount";
import { NowPlaying } from "@/features/jukebox/ui/NowPlaying";
import { PlayPauseButton } from "@/features/jukebox/ui/PlayPauseButton";
import { QueueList } from "@/features/jukebox/ui/QueueList";
import { SkipButton } from "@/features/jukebox/ui/SkipButton";
import { VolumeControl } from "@/features/jukebox/ui/VolumeControl";
import { usePlayerStore } from "@/features/player/stores/playerStore";

export const JukeboxPlayer: React.FunctionComponent = () => {
  const { data: state, isLoading, error } = useJukeboxState();
  const enqueueMutation = useEnqueue();
  const cancelMineMutation = useCancelMine();
  const skipVoteMutation = useSkipVote();
  // 飛行中のキャンセル trackId 集合。単一 mutation の variables は直近の呼び出ししか
  // 保持しないため、並行キャンセル時に各ボタンを正しく無効化できるよう自前で追跡する。
  const [cancellingIds, setCancellingIds] = useState<ReadonlySet<number>>(
    () => new Set<number>(),
  );
  const currentTimeSec = usePlayerStore(
    (s) => s.players.primary.currentTime ?? 0,
  );

  // presence heartbeat: このコンポーネントがマウントされている間だけ送信
  usePresenceHeartbeat();

  // nowPlaying を監視してグローバルプレイヤーをドライブする
  // 再生・同期追従は MiniPlayer + useSyncController に委譲
  useJukeboxPlayer({
    nowPlaying: state?.nowPlaying ?? null,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-destructive text-sm">
        接続エラー: {error.message}
      </div>
    );
  }

  const nowPlaying = state?.nowPlaying ?? null;

  return (
    <div className="flex flex-col gap-0 pb-safe">
      {/* 再生中情報 */}
      <div className="px-4 pt-3">
        <NowPlaying nowPlaying={nowPlaying} currentTimeSec={currentTimeSec} />
      </div>

      {/* リスナー数 + 再生/一時停止 + スキップボタン */}
      <div className="flex items-center justify-between px-4 py-2">
        <ListenerCount count={state?.listeners ?? 0} />
        <div className="flex items-center gap-2">
          <PlayPauseButton disabled={!nowPlaying} />
          <SkipButton
            myVoted={nowPlaying?.myVoted ?? false}
            onVote={(): void => {
              if (nowPlaying) skipVoteMutation.mutate(nowPlaying.id);
            }}
            isPending={skipVoteMutation.isPending}
            disabled={!nowPlaying}
          />
        </div>
      </div>

      {/* 音量調節 */}
      <VolumeControl />

      {/* 曲追加フォーム */}
      <AddSongForm
        onSubmit={(url: string, onSuccess: () => void): void => {
          void enqueueMutation.mutate(url, { onSuccess });
        }}
        isPending={enqueueMutation.isPending}
        error={enqueueMutation.error}
        enqueueCooldownRemainingSec={state?.enqueueCooldownRemainingSec ?? 0}
      />

      {/* キュー */}
      <div className="flex flex-col">
        <h2 className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          キュー ({state?.queue.length ?? 0} 曲)
        </h2>
        <QueueList
          queue={state?.queue ?? []}
          nowPlaying={nowPlaying}
          serverNowMs={state?.serverNowMs ?? Date.now()}
          onCancelMine={(trackId: number): void => {
            setCancellingIds((prev) => new Set(prev).add(trackId));
            cancelMineMutation.mutate(trackId, {
              onSettled: (): void => {
                setCancellingIds((prev) => {
                  const next = new Set(prev);
                  next.delete(trackId);
                  return next;
                });
              },
            });
          }}
          cancellingIds={cancellingIds}
          onVote={(trackId: number): void => {
            skipVoteMutation.mutate(trackId);
          }}
          isVoting={skipVoteMutation.isPending}
        />
      </div>
    </div>
  );
};
