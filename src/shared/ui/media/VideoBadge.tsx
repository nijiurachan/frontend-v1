import { MdVideocam } from "react-icons/md";

/**
 * 動画サムネイルの右上に表示する小さなビデオバッジ
 * カタログなどのグリッド表示で使用
 */
export const VideoBadge: React.FunctionComponent = () => {
  return (
    <div className="absolute top-1 right-1 p-1 bg-black/50 rounded">
      <MdVideocam className="w-4 h-4 text-white" />
    </div>
  );
};
