// src/features/jukebox/components/JukeboxPlayer.tsx

import { useCancelMine } from "@/features/jukebox/hooks/useCancelMine";
import { useEnqueue } from "@/features/jukebox/hooks/useEnqueue";
import { useJukeboxPlayer } from "@/features/jukebox/hooks/useJukeboxPlayer";
import { useJukeboxState } from "@/features/jukebox/hooks/useJukeboxState";
import { usePresenceHeartbeat } from "@/features/jukebox/hooks/usePresenceHeartbeat";
import { useSkipVote } from "@/features/jukebox/hooks/useSkipVote";
import { AddSongForm } from "@/features/jukebox/ui/AddSongForm";
import { ListenerCount } from "@/features/jukebox/ui/ListenerCount";
import { NowPlaying } from "@/features/jukebox/ui/NowPlaying";
import { QueueList } from "@/features/jukebox/ui/QueueList";
import { SkipButton } from "@/features/jukebox/ui/SkipButton";
import { YouTubeEmbed } from "@/features/player/adapters/YouTubeEmbed";
import { usePlayerStore } from "@/features/player/stores/playerStore";

export const JukeboxPlayer: React.FunctionComponent = () => {
  const { data: state, isLoading, error } = useJukeboxState();
  const enqueueMutation = useEnqueue();
  const cancelMineMutation = useCancelMine();
  const skipVoteMutation = useSkipVote();
  const currentTimeSec = usePlayerStore(
    (s) => s.players.primary.currentTime ?? 0,
  );

  // presence heartbeat: このコンポーネントがマウントされている間だけ送信
  usePresenceHeartbeat();

  // jukebox 再生・seek・ドリフト補正
  useJukeboxPlayer({
    nowPlaying: state?.nowPlaying ?? null,
    serverNowMs: state?.serverNowMs ?? 0,
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
  const isYouTube = nowPlaying?.source === "youtube";

  return (
    <div className="flex flex-col gap-0 pb-safe">
      {/* 動画エリア: YouTube のみ表示 */}
      {isYouTube && nowPlaying && (
        <div className="w-full aspect-video bg-black">
          <YouTubeEmbed providerId={nowPlaying.mediaId} slotId="primary" />
        </div>
      )}

      {/* 再生中情報 */}
      <div className="px-4 pt-3">
        <NowPlaying nowPlaying={nowPlaying} currentTimeSec={currentTimeSec} />
      </div>

      {/* リスナー数 + スキップボタン */}
      <div className="flex items-center justify-between px-4 py-2">
        <ListenerCount count={state?.listeners ?? 0} />
        <SkipButton
          mySkipVoted={state?.mySkipVoted ?? false}
          onVote={(): void => {
            void skipVoteMutation.mutate();
          }}
          isPending={skipVoteMutation.isPending}
          disabled={!nowPlaying}
        />
      </div>

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
          onCancelMine={(): void => {
            void cancelMineMutation.mutate();
          }}
          isCancelling={cancelMineMutation.isPending}
        />
      </div>
    </div>
  );
};
