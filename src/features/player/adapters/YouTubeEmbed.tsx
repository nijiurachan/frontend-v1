// ============================================================
// adapters/YouTubeEmbed.tsx
// YouTube iframe API 埋め込み — API ローダー + コンポーネント + ストア同期
// ============================================================

import { useEffect, useRef } from "react";
import type { SlotId } from "../stores/playerStore";
import { usePlayerStore } from "../stores/playerStore";

// ----------------------------------------------------------
// YouTube IFrame API ローダー（モジュールレベル・シングルトン）
// ----------------------------------------------------------

let apiPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve, reject) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    window.onYouTubeIframeAPIReady = (): void => resolve();
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = (): void => {
      apiPromise = null;
      reject(new Error("Failed to load YouTube IFrame API"));
    };
    document.head.appendChild(script);
  });

  return apiPromise;
}

// ----------------------------------------------------------
// ストアアクセス（安定参照）
// ----------------------------------------------------------

const getStore = (): ReturnType<typeof usePlayerStore.getState> =>
  usePlayerStore.getState();

// ----------------------------------------------------------
// コンポーネント
// ----------------------------------------------------------

interface YouTubeEmbedProps {
  providerId: string;
  slotId: SlotId;
  onFullControlChange?: (hasFullControl: boolean) => void;
}

export const YouTubeEmbed: React.FunctionComponent<YouTubeEmbedProps> = ({
  providerId,
  slotId,
  onFullControlChange,
}: YouTubeEmbedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YT.Player | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // sourceRef で「誰が状態変更を発生させたか」を追跡し無限ループを防ぐ
  const sourceRef = useRef<"store" | "player" | null>(null);
  const mountedRef = useRef(true);
  // 非同期 init のレースコンディション防止用 generation counter
  const generationRef = useRef(0);

  useEffect(() => {
    onFullControlChange?.(true);
  }, [onFullControlChange]);

  useEffect(() => {
    mountedRef.current = true;
    const generation = ++generationRef.current;
    let player: YT.Player | null = null;

    const init = async (): Promise<void> => {
      try {
        await loadYouTubeAPI();
      } catch {
        if (mountedRef.current) getStore().setStatus(slotId, "error");
        return;
      }
      // mountedRef + generation の二重チェックで stale init を確実に abort
      if (
        !mountedRef.current ||
        generation !== generationRef.current ||
        !containerRef.current
      ) {
        return;
      }

      const s = getStore();
      s.setStatus(slotId, "loading");

      // 前の init が残した orphan ノードを確実に除去してから新しい player を作成。
      // containerRef は YouTubeEmbed 自身の div なので React の管理外。
      containerRef.current.innerHTML = "";

      const innerDiv = document.createElement("div");
      containerRef.current.appendChild(innerDiv);

      player = new YT.Player(innerDiv, {
        videoId: providerId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          rel: 0,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: (): void => {
            if (!mountedRef.current) return;
            playerRef.current = player;
          },
          onStateChange: (event: YT.OnStateChangeEvent): void => {
            if (!mountedRef.current) return;
            handleStateChange(event.data);
          },
          onError: (): void => {
            if (!mountedRef.current) return;
            getStore().setStatus(slotId, "error");
          },
        },
      });
    };

    const handleStateChange = (state: YT.PlayerState): void => {
      const store = getStore();

      // ストア起点の操作中はイベントを無視
      if (sourceRef.current === "store") {
        sourceRef.current = null;
        return;
      }

      sourceRef.current = "player";

      switch (state) {
        case YT.PlayerState.PLAYING: {
          store.setStatus(slotId, "playing");
          // duration を取得して Track に反映
          if (player) {
            const duration = player.getDuration();
            if (duration > 0) {
              const track = store.players[slotId].currentTrack;
              if (track && !track.duration) {
                store.loadTrack(slotId, { ...track, duration });
                store.setStatus(slotId, "playing");
              }
            }
          }
          startTimeUpdate();
          break;
        }
        case YT.PlayerState.PAUSED:
          store.setStatus(slotId, "paused");
          stopTimeUpdate();
          break;
        case YT.PlayerState.ENDED:
          store.setStatus(slotId, "ended");
          stopTimeUpdate();
          break;
        case YT.PlayerState.BUFFERING:
          store.setStatus(slotId, "loading");
          break;
        default:
          break;
      }

      sourceRef.current = null;
    };

    const startTimeUpdate = (): void => {
      stopTimeUpdate();
      intervalRef.current = setInterval(() => {
        if (!player || !mountedRef.current) return;
        const time = player.getCurrentTime();
        getStore().updateTime(slotId, time);
      }, 250);
    };

    const stopTimeUpdate = (): void => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    void init();

    // ストア購読: status 変化に応じて iframe を制御
    const unsubStatus = usePlayerStore.subscribe(
      (s) => s.players[slotId].status,
      (status) => {
        if (!playerRef.current || sourceRef.current === "player") return;
        sourceRef.current = "store";
        if (status === "playing") {
          playerRef.current.playVideo();
        } else if (status === "paused") {
          playerRef.current.pauseVideo();
        }
      },
    );

    // ストア購読: seekTarget 変化に応じてシーク実行
    const unsubSeek = usePlayerStore.subscribe(
      (s) => s.players[slotId].seekTarget,
      (seekTarget) => {
        if (seekTarget == null || !playerRef.current) return;
        playerRef.current.seekTo(seekTarget, true);
        getStore().clearSeekTarget(slotId);
      },
    );

    return (): void => {
      mountedRef.current = false;
      stopTimeUpdate();
      unsubStatus();
      unsubSeek();
      // playerRef.current（onReady 後）または local player（onReady 前）を破棄。
      // どちらか一方しか有効でないため ?? で fallback する。
      const p = playerRef.current ?? player;
      if (p) {
        try {
          p.destroy();
        } catch {
          // 既に破棄済み or DOM が detached の場合は無視
        }
      }
      playerRef.current = null;
      // destroy() で残った残骸をクリア（外側 div は React が管理）
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [providerId, slotId]);

  return <div ref={containerRef} className="w-full h-full" />;
};
