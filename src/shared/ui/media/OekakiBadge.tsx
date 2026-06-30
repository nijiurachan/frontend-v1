import iconOekaki from "@/assets/img/icon_oekaki.svg";

/**
 * お絵描きスレのサムネイル右上に表示する小さなバッジ
 * カタログなどのグリッド表示で使用
 */
export const OekakiBadge: React.FunctionComponent = () => {
  return (
    <div className="absolute top-1 right-1 p-1 bg-badge rounded">
      <img src={iconOekaki} alt="" aria-hidden="true" className="w-4 h-4" />
    </div>
  );
};
