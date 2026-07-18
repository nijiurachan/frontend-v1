// ============================================================
// MiniPlayerStashHandle.tsx
// 画面外スタッシュ中に隅へ出す復帰ハンドル（タップでプレイヤを画面内へ戻す）
// ============================================================

import { motion } from "motion/react";
import { BsChevronCompactLeft, BsChevronCompactRight } from "react-icons/bs";
import { FiVideo } from "react-icons/fi";
import type { MiniPlayerPosition } from "@/features/player/stores/playerStore";

// 隅 → 画面端へ密着させる配置（縦位置はプレイヤ本体のアンカーと揃える）
const HANDLE_POSITION_CLASSES: Record<MiniPlayerPosition, string> = {
  tr: "top-2 right-0 rounded-l-lg",
  br: "bottom-[58px] right-0 rounded-l-lg",
  tl: "top-2 left-0 rounded-r-lg",
  bl: "bottom-[58px] left-0 rounded-r-lg",
};

function isRightCorner(position: MiniPlayerPosition): boolean {
  return position === "tr" || position === "br";
}

interface MiniPlayerStashHandleProps {
  position: MiniPlayerPosition;
  onRestore: () => void;
}

export const MiniPlayerStashHandle: React.FunctionComponent<
  MiniPlayerStashHandleProps
> = ({ position, onRestore }: MiniPlayerStashHandleProps) => {
  const right = isRightCorner(position);
  const slideOut = right ? 40 : -40;

  return (
    <motion.button
      type="button"
      onClick={onRestore}
      aria-label="プレイヤーを表示"
      className={`absolute z-30 pointer-events-auto w-10 h-[120px] flex items-center justify-center bg-black/80 text-white/90 shadow-2xl cursor-pointer hover:bg-black/90 transition-colors ${HANDLE_POSITION_CLASSES[position]}`}
      initial={{ x: slideOut, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: slideOut, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
    >
      <FiVideo
        className="absolute top-4 w-5 h-5 opacity-80"
        aria-hidden="true"
      />
      {right ? (
        <BsChevronCompactLeft className="w-9 h-9" aria-hidden="true" />
      ) : (
        <BsChevronCompactRight className="w-9 h-9" aria-hidden="true" />
      )}
    </motion.button>
  );
};
