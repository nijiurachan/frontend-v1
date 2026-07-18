import { FiTrash2 } from "react-icons/fi";
import {
  MdBlock,
  MdReport,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import noImage from "@/assets/img/no-image.svg";
import type { Thread } from "@/entities/thread";
import { getImageUrl, getThreadTitle } from "@/entities/thread";
import { useHistoryStore } from "@/features/history/stores/historyStore";
import { useNgStore } from "@/features/ng-filter/stores/ngStore";
import { useDelMutation } from "@/shared/hooks/useDelMutation";
import { Button } from "@/shared/ui/form";
import { Modal } from "@/shared/ui/overlay";

interface Props {
  thread: Thread;
  isOpen: boolean;
  onClose: () => void;
}

export const ThreadContextMenu: React.FunctionComponent<Props> = ({
  thread,
  isOpen,
  onClose,
}: Props) => {
  const { hiddenThreadIds, hideThread, unhideThread, addNgTitle } =
    useNgStore();
  const { removeFromHistory } = useHistoryStore();
  const { mutate: del } = useDelMutation();

  const handleDel = (): void => {
    if (confirm("スレッドをdelしますか？")) {
      del(thread.opPost.id);
    }
    onClose();
  };

  const handleHide = (): void => {
    hideThread(thread.id);
    onClose();
  };

  const handleUnhide = (): void => {
    unhideThread(thread.id);
    onClose();
  };

  const handleNgTitle = (): void => {
    const title = getThreadTitle(thread);
    addNgTitle(title);
    alert(`「${title.slice(0, 20)}...」をNGスレ文に追加しました`);
    onClose();
  };

  const handleRemoveHistory = (): void => {
    removeFromHistory(thread.id);
    alert("履歴から削除しました");
    onClose();
  };

  const imageUrl = getImageUrl(thread.opPost.attachment, false);
  const title = getThreadTitle(thread);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel="スレッド操作"
      position="bottom"
    >
      {/* プレビュー */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <img
          src={imageUrl}
          alt=""
          className="w-16 h-16 rounded object-cover bg-muted"
          onError={(e: React.SyntheticEvent<HTMLImageElement>): void => {
            (e.target as HTMLImageElement).src = noImage;
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground truncate">{title}</div>
          <div className="text-sm text-muted-foreground">
            スレッドID: {thread.id} / {thread.replyCount}レス
          </div>
        </div>
      </div>

      {/* アクション */}
      <div className="p-2 space-y-1">
        <Button
          variant="menu"
          onClick={handleDel}
          icon={<MdReport className="w-5 h-5" />}
        >
          del
        </Button>
        {
          // スレが「非表示」機能によって非表示になっている場合のみ、「表示」ボタンを代わりに表示する。
          // つまり、NGワードなど別要因により非表示になっている場合は除く(とりあえずは)。
          // isThreadHiddenはNGワードを含む全ての要因を考慮するのでここでは使用できない。
          hiddenThreadIds.includes(thread.id) ? (
            <Button
              variant="menu"
              onClick={handleUnhide}
              icon={<MdVisibility className="w-5 h-5" />}
            >
              表示
            </Button>
          ) : (
            <Button
              variant="menu"
              onClick={handleHide}
              icon={<MdVisibilityOff className="w-5 h-5" />}
            >
              非表示
            </Button>
          )
        }
        <Button
          variant="menu"
          onClick={handleNgTitle}
          icon={<MdBlock className="w-5 h-5" />}
        >
          NGスレ文追加
        </Button>
        <Button
          variant="menu"
          onClick={handleRemoveHistory}
          icon={<FiTrash2 className="w-5 h-5" />}
        >
          履歴から削除
        </Button>
      </div>

      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          onClick={onClose}
          className="w-full py-3 text-center"
        >
          キャンセル
        </Button>
      </div>
    </Modal>
  );
};
