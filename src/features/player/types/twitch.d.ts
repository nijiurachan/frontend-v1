// ============================================================
// Twitch Embed Player API 型宣言（最小限）
// https://dev.twitch.tv/docs/embed/video-and-clips/
// ============================================================

declare namespace Twitch {
  interface PlayerOptions {
    width?: string | number;
    height?: string | number;
    /** ライブ配信チャンネル名 */
    channel?: string;
    /** アーカイブ動画ID */
    video?: string;
    /** 埋め込み元のホスト名リスト（必須） */
    parent: string[];
    autoplay?: boolean;
    muted?: boolean;
  }

  class Player {
    constructor(element: HTMLElement | string, options: PlayerOptions);

    // 再生制御
    play(): void;
    pause(): void;
    seek(seconds: number): void;

    // 状態取得
    getCurrentTime(): number;
    getDuration(): number;
    getMuted(): boolean;
    setMuted(muted: boolean): void;
    getVolume(): number;
    setVolume(volume: number): void;
    destroy(): void;

    // イベント
    addEventListener(event: string, callback: () => void): void;
    removeEventListener(event: string, callback: () => void): void;

    // イベント名定数
    static READY: string;
    static PLAY: string;
    static PAUSE: string;
    static ENDED: string;
    static ONLINE: string;
    static OFFLINE: string;
  }
}

interface Window {
  Twitch?: { Player: typeof Twitch.Player };
}
