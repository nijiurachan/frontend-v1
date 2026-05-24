import { FiPlayCircle } from "react-icons/fi";

interface VideoPlayOverlayProps {
  size?: "small" | "medium" | "large";
}

/**
 * 動画サムネイルの中心に表示する再生ボタンオーバーレイ
 * スレッドビュー、ポスト、画像一覧などで使用
 */
export const VideoPlayOverlay: React.FunctionComponent<
  VideoPlayOverlayProps
> = ({ size = "large" }: VideoPlayOverlayProps) => {
  const iconSizeClass = {
    small: "w-8 h-8",
    medium: "w-10 h-10",
    large: "w-12 h-12",
  }[size];

  const paddingClass = {
    small: "p-2",
    medium: "p-2.5",
    large: "p-3",
  }[size];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className={`bg-black/50 rounded-full ${paddingClass}`}>
        <FiPlayCircle className={`${iconSizeClass} text-white`} />
      </div>
    </div>
  );
};
