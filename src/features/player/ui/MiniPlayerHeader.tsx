// ============================================================
// MiniPlayerHeader.tsx
// ヘッダ部: タイトル、フリックエリア（4隅遷移）、サイズ/閉じるボタン
// ============================================================

import { useCallback, useRef } from "react";
import { FiX } from "react-icons/fi";
import type { MiniPlayerPosition } from "@/features/player/stores/playerStore";

const SWIPE_THRESHOLD = 30;
const SIZE_LABELS = ["小", "中", "大", "豆"] as const;

interface MiniPlayerHeaderProps {
  position: MiniPlayerPosition;
  sizeIndex: number;
  onPositionChange: (position: MiniPlayerPosition) => void;
  onCycleSize: () => void;
  onClose: () => void;
  /** 外向き横フリックで画面外スタッシュ */
  onStash: () => void;
}

/** フリック方向からポジション遷移を計算 */
function getNextPosition(
  current: MiniPlayerPosition,
  dx: number,
  dy: number,
): MiniPlayerPosition {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx > absDy) {
    // 横フリック
    if (dx > 0) {
      if (current === "tl") return "tr";
      if (current === "bl") return "br";
    } else {
      if (current === "tr") return "tl";
      if (current === "br") return "bl";
    }
  } else {
    // 縦フリック
    if (dy > 0) {
      if (current === "tl") return "bl";
      if (current === "tr") return "br";
    } else {
      if (current === "bl") return "tl";
      if (current === "br") return "tr";
    }
  }
  return current;
}

export const MiniPlayerHeader: React.FunctionComponent<
  MiniPlayerHeaderProps
> = ({
  position,
  sizeIndex,
  onPositionChange,
  onCycleSize,
  onClose,
  onStash,
}: MiniPlayerHeaderProps) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    touchStart.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!touchStart.current) return;
      const dx = e.clientX - touchStart.current.x;
      const dy = e.clientY - touchStart.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      touchStart.current = null;

      if (dist < SWIPE_THRESHOLD) return;

      // 外向きの横フリック（右隅で右／左隅で左）→ 画面外スタッシュ
      if (Math.abs(dx) > Math.abs(dy)) {
        const isRightCorner = position === "tr" || position === "br";
        const isLeftCorner = position === "tl" || position === "bl";
        if ((isRightCorner && dx > 0) || (isLeftCorner && dx < 0)) {
          onStash();
          return;
        }
      }

      const next = getNextPosition(position, dx, dy);
      if (next !== position) {
        onPositionChange(next);
      }
    },
    [position, onPositionChange, onStash],
  );

  return (
    <div className="flex items-center gap-2 px-1 bg-black/80 h-9 relative z-10">
      {/* サイズボタン */}
      <button
        type="button"
        onClick={onCycleSize}
        className="relative shrink-0 w-7 h-7 bg-white/15 text-white/70 text-[16px] px-0 py-0 rounded cursor-pointer hover:bg-white/30 transition-colors
                before:absolute before:content-[''] before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:min-w-[44px] before:min-h-[44px]"
      >
        {SIZE_LABELS[sizeIndex]}
      </button>

      {/* フリックエリア */}
      <div
        className="flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none relative"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full min-h-[44px]"></div>
        <span className="block w-full h-7 mx-1 bg-white/10 text-white/70 text-[14px] text-center py-1 rounded select-none pointer-events-none truncate">
          ↔️↕️ フリックで移動
        </span>
      </div>

      {/* 閉じるボタン */}
      <button
        type="button"
        onClick={onClose}
        className="relative shrink-0 w-7 h-7 flex items-center justify-center bg-white/15 text-white/70 rounded cursor-pointer hover:bg-white/30 transition-colors
                before:absolute before:content-[''] before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:min-w-[44px] before:min-h-[44px]"
        aria-label="プレイヤーを閉じる"
      >
        <FiX className="w-4.5 h-4.5" />
      </button>
    </div>
  );
};
