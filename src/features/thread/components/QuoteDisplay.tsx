interface Props {
  content: string;
  onClick?: (quoteText: string) => void;
}

/**
 * 引用テキストを表示するコンポーネント
 * クリック時に引用テキストを親に通知する
 */
export const QuoteDisplay: React.FunctionComponent<Props> = ({
  content,
  onClick,
}: Props) => {
  const handleClick = (): void => {
    onClick?.(content);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: TODO label＆buttonで置き換え予定
    // biome-ignore lint/a11y/useKeyWithClickEvents: TODO label＆buttonで置き換え予定
    <div
      className="text-quote cursor-pointer hover:underline"
      onClick={handleClick}
    >
      {content}
    </div>
  );
};
