// ============================================================
// adapters/TwitchEmbed.tsx
// Twitch Embed Player API — チャンネル/VOD は API プレイヤー、
// クリップは Embed API 非対応のため iframe フォールバック。
// ============================================================

import { useEffect, useRef } from "react";
import type { SlotId } from "../stores/playerStore";
import { usePlayerStore } from "../stores/playerStore";

// ----------------------------------------------------------
// Twitch Embed API ローダー（モジュールレベル・シングルトン）
// ----------------------------------------------------------

let apiPromise: Promise<void> | null = null;

function loadTwitchAPI(): Promise<void> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<void>((resolve, reject) => {
    if (window.Twitch?.Player) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://embed.twitch.tv/embed/v1.js";
    script.onload = (): void => resolve();
    script.onerror = (): void => {
      apiPromise = null;
      reject(new Error("Failed to load Twitch Embed API"));
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
// サブタイプ解析
// ----------------------------------------------------------

type TwitchSubtype = "channel" | "video" | "clip";

interface ParsedTwitchId {
  subtype: TwitchSubtype;
  id: string;
}

function parseTwitchProviderId(providerId: string): ParsedTwitchId {
  const colonIdx = providerId.indexOf(":");
  if (colonIdx === -1) {
    return { subtype: "channel", id: providerId };
  }
  const prefix = providerId.slice(0, colonIdx) as TwitchSubtype;
  const id = providerId.slice(colonIdx + 1);
  return { subtype: prefix, id };
}

// ----------------------------------------------------------
// メインコンポーネント
// ----------------------------------------------------------

interface TwitchEmbedProps {
  providerId: string;
  slotId: SlotId;
  onFullControlChange?: (hasFullControl: boolean) => void;
}

export const TwitchEmbed: React.FunctionComponent<TwitchEmbedProps> = ({
  providerId,
  slotId,
  onFullControlChange,
}: TwitchEmbedProps) => {
  const { subtype, id } = parseTwitchProviderId(providerId);

  if (subtype === "clip") {
    return (
      <TwitchClipIframe
        clipId={id}
        slotId={slotId}
        onFullControlChange={onFullControlChange}
      />
    );
  }

  return (
    <TwitchApiPlayer
      subtype={subtype}
      id={id}
      slotId={slotId}
      onFullControlChange={onFullControlChange}
    />
  );
};

// ----------------------------------------------------------
// クリップ用 iframe（パッシブ、ニコニコ方式）
// ----------------------------------------------------------

interface TwitchClipIframeProps {
  clipId: string;
  slotId: SlotId;
  onFullControlChange?: (hasFullControl: boolean) => void;
}

const TwitchClipIframe: React.FunctionComponent<TwitchClipIframeProps> = ({
  clipId,
  slotId,
  onFullControlChange,
}: TwitchClipIframeProps) => {
  useEffect(() => {
    onFullControlChange?.(false);
  }, [onFullControlChange]);

  useEffect(() => {
    getStore().setStatus(slotId, "playing");
    return (): void => {
      getStore().setStatus(slotId, "idle");
    };
  }, [slotId]);

  const hostname = window.location.hostname;

  return (
    <iframe
      src={`https://clips.twitch.tv/embed?clip=${clipId}&parent=${hostname}`}
      className="w-full h-full border-0"
      allow="autoplay; fullscreen"
      allowFullScreen
      title={`Twitch Clip ${clipId}`}
    />
  );
};

// ----------------------------------------------------------
// チャンネル/VOD 用 API プレイヤー（YouTube 方式）
// ----------------------------------------------------------

interface TwitchApiPlayerProps {
  subtype: "channel" | "video";
  id: string;
  slotId: SlotId;
  onFullControlChange?: (hasFullControl: boolean) => void;
}

const TwitchApiPlayer: React.FunctionComponent<TwitchApiPlayerProps> = ({
  subtype,
  id,
  slotId,
  onFullControlChange,
}: TwitchApiPlayerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Twitch.Player | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sourceRef = useRef<"store" | "player" | null>(null);
  const mountedRef = useRef(true);
  const generationRef = useRef(0);

  useEffect(() => {
    onFullControlChange?.(true);
  }, [onFullControlChange]);

  useEffect(() => {
    mountedRef.current = true;
    const generation = ++generationRef.current;
    let player: Twitch.Player | null = null;

    const init = async (): Promise<void> => {
      try {
        await loadTwitchAPI();
      } catch {
        if (mountedRef.current) getStore().setStatus(slotId, "error");
        return;
      }
      if (
        !mountedRef.current ||
        generation !== generationRef.current ||
        !containerRef.current
      ) {
        return;
      }

      const s = getStore();
      s.setStatus(slotId, "loading");

      containerRef.current.innerHTML = "";

      const innerDiv = document.createElement("div");
      innerDiv.style.width = "100%";
      innerDiv.style.height = "100%";
      containerRef.current.appendChild(innerDiv);

      const opts: Twitch.PlayerOptions = {
        parent: [window.location.hostname],
        autoplay: false,
        muted: getStore().players[slotId].muted,
        width: "100%",
        height: "100%",
      };
      if (subtype === "video") {
        opts.video = id;
      } else {
        opts.channel = id;
      }

      player = new Twitch.Player(innerDiv, opts);

      // ---- イベント登録 ----
      // Twitch SDK のバージョンによって静的定数が存在しない場合があるため、
      // 文字列リテラルを使用する

      player.addEventListener("ready", () => {
        if (!mountedRef.current) return;
        playerRef.current = player;
        // autoplay: false のため、初期状態を paused に設定
        getStore().setStatus(slotId, "paused");
      });

      player.addEventListener("play", () => {
        if (!mountedRef.current) return;

        if (sourceRef.current === "store") {
          sourceRef.current = null;
          return;
        }
        sourceRef.current = "player";

        const store = getStore();
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

        sourceRef.current = null;
      });

      player.addEventListener("pause", () => {
        if (!mountedRef.current) return;

        if (sourceRef.current === "store") {
          sourceRef.current = null;
          return;
        }
        sourceRef.current = "player";

        getStore().setStatus(slotId, "paused");
        stopTimeUpdate();

        sourceRef.current = null;
      });

      player.addEventListener("ended", () => {
        if (!mountedRef.current) return;
        getStore().setStatus(slotId, "ended");
        stopTimeUpdate();
      });
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

    // ストア購読: status 変化に応じてプレイヤーを制御
    const unsubStatus = usePlayerStore.subscribe(
      (s) => s.players[slotId].status,
      (status) => {
        if (!playerRef.current || sourceRef.current === "player") return;
        sourceRef.current = "store";
        if (status === "playing") {
          playerRef.current.play();
        } else if (status === "paused") {
          playerRef.current.pause();
        }
      },
    );

    // ストア購読: seekTarget 変化に応じてシーク実行
    const unsubSeek = usePlayerStore.subscribe(
      (s) => s.players[slotId].seekTarget,
      (seekTarget) => {
        if (seekTarget == null || !playerRef.current) return;
        playerRef.current.seek(seekTarget);
        getStore().clearSeekTarget(slotId);
      },
    );

    // ストア購読: muted 変化に応じてプレイヤーのミュートを切り替え
    const unsubMuted = usePlayerStore.subscribe(
      (s) => s.players[slotId].muted,
      (muted) => {
        if (!playerRef.current) return;
        playerRef.current.setMuted(muted);
      },
    );

    const container = containerRef.current;
    return (): void => {
      mountedRef.current = false;
      stopTimeUpdate();
      unsubStatus();
      unsubSeek();
      unsubMuted();
      const p = playerRef.current ?? player;
      if (p) {
        try {
          p.destroy();
        } catch {
          // 既に破棄済み or DOM が detached の場合は無視
        }
      }
      playerRef.current = null;
      if (container) container.innerHTML = "";
    };
  }, [subtype, id, slotId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full [&_iframe]:!w-full [&_iframe]:!h-full"
    />
  );
};
