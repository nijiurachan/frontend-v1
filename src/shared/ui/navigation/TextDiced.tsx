export interface TextDicedProps {
  /**
   * ダイス表記のプレフィックス (e.g., "dice2d6=(")
   */
  prefix: string;
  /**
   * ダイスの結果値 (e.g., "1+5")
   */
  resultValue: string;
  /**
   * ダイス表記のサフィックス (e.g., ")")
   */
  suffix: string;
  /**
   * 結果値部分の追加クラス名
   */
  className?: string;
}

/**
 * ダイス表記を表示するコンポーネント
 * プレフィックスとサフィックスは通常色、結果値を強調色で表示
 */
export const TextDiced: React.FunctionComponent<TextDicedProps> = ({
  prefix,
  resultValue,
  suffix,
  className,
}: TextDicedProps) => {
  return (
    <span>
      <span>{prefix}</span>
      <span className={className ?? "text-destructive"}>{resultValue}</span>
      <span>{suffix}</span>
    </span>
  );
};
