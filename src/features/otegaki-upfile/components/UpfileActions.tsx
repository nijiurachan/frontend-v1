import type { UpfileV2Commands } from "@nijiurachan/js/components";
import type { UpfileUiHintFlags } from "@nijiurachan/js/pure";
import { BsPalette } from "react-icons/bs";
import { FiClipboard, FiPaperclip } from "react-icons/fi";

interface Props {
  hint: UpfileUiHintFlags | undefined;
  host: UpfileV2Commands;
}

export const UpfileActions: React.FunctionComponent<Props> = ({
  hint,
  host,
}: Props) => {
  const buttonClass =
    "flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-sm text-foreground";

  return (
    <div className="flex flex-col gap-2">
      {hint?.showAllowImageLabel && (
        <aside className="text-xs text-muted-foreground">
          画像添付は許可されていません（お絵描きは可能）
        </aside>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`${buttonClass} flex-col justify-center gap-1 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-card`}
          onClick={(): void => host.clickFileattach()}
          disabled={!hint?.showUpfileButton}
        >
          <FiPaperclip className="w-11 h-5 text-primary" />
          <span className="text-[0.7rem] leading-none">ファイル</span>
        </button>

        <button
          type="button"
          className={`${buttonClass} flex-col justify-center gap-1 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-card`}
          onClick={(): void => host.clickPaint()}
          disabled={!hint?.showPaintButton}
        >
          <BsPalette className="w-11 h-5 text-primary" />
          <span className="text-[0.7rem] leading-none">お絵かき</span>
        </button>

        <button
          type="button"
          className={`${buttonClass} flex-col justify-center gap-1 disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-card`}
          onClick={(): void => host.clickPaste()}
          disabled={!hint?.showPasteButton}
        >
          <FiClipboard className="w-11 h-5 text-primary" />
          <span className="text-[0.7rem] leading-none">貼り付け</span>
        </button>
      </div>
    </div>
  );
};
