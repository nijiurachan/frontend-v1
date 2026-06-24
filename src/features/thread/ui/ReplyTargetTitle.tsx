import noImage from "@/assets/img/no-image.svg";
import { getImageUrl, getThreadTitle, type Thread } from "@/entities/thread";
import { decorateTitle } from "@/shared/lib";

interface Props {
  thread: Thread;
}

/**
 * 返信モーダルのタイトル欄に表示する「返信先スレッド」のミニ表示。
 * スレッドのサムネ（ミニサイズ）とスレ文を1行で表示し、幅を超える場合は省略する。
 * サムネが無い／読み込み失敗時は no-image プレースホルダーへフォールバックする
 * （カタログ表示と同じ getImageUrl + onError パターン）。
 */
export const ReplyTargetTitle: React.FunctionComponent<Props> = ({
  thread,
}: Props) => {
  // カタログと同じヘルパーでタイトル（無ければ本文先頭）を解決。
  // CSS truncate で幅に応じて省略するため、文字数は多めに確保しておく。
  const title = decorateTitle(getThreadTitle(thread, 120));
  const imageUrl = getImageUrl(thread.attachment, false);

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="relative w-9 h-9 shrink-0 rounded bg-muted overflow-hidden">
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e: React.SyntheticEvent<HTMLImageElement>): void => {
            (e.target as HTMLImageElement).src = noImage;
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <span className="block text-2xs leading-none text-muted-foreground">
          返信先
        </span>
        <span className="block truncate text-sm font-semibold text-foreground">
          {title}
        </span>
      </div>
    </div>
  );
};
