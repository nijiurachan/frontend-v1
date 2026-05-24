import { BsImage } from "react-icons/bs";
import { FiTrash2 } from "react-icons/fi";
import { MdBlock, MdReport, MdVisibilityOff } from "react-icons/md";
import noImage from "@/assets/img/no-image.svg";
import type { Thread } from "@/entities/thread";
import { getImageUrl, getThreadTitle } from "@/entities/thread";
import { useHistoryStore } from "@/features/history/stores/historyStore";
import {
  addNgImageFromAttachment,
  useNgStore,
} from "@/features/ng-filter/stores/ngStore";
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
  const { hideThread, addNgTitle } = useNgStore();
  const { removeFromHistory } = useHistoryStore();
  const { mutate: del } = useDelMutation();

  const handleDel = (): void => {
    if (confirm("スレッドをdelしますか？")) {
      del(thread.op_post_id);
    }
    onClose();
  };

  const handleHide = (): void => {
    hideThread(thread.id);
    onClose();
  };

  const handleNgTitle = (): void => {
    const title = getThreadTitle(thread);
    addNgTitle(title);
    alert(`「${title.slice(0, 20)}...」をNGスレ文に追加しました`);
    onClose();
  };

  const handleNgImage = (): void => {
    if (!thread.attachment?.ng_hash) return;
    addNgImageFromAttachment(thread.attachment);
    alert("画像NGに追加しました");
    onClose();
  };

  const handleRemoveHistory = (): void => {
    removeFromHistory(thread.id);
    alert("履歴から削除しました");
    onClose();
  };

  const imageUrl = getImageUrl(thread.attachment, false);
  const title = getThreadTitle(thread);

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="bottom">
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
            No.{thread.id} / {thread.replies_count}レス
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
        <Button
          variant="menu"
          onClick={handleHide}
          icon={<MdVisibilityOff className="w-5 h-5" />}
        >
          非表示
        </Button>
        <Button
          variant="menu"
          onClick={handleNgTitle}
          icon={<MdBlock className="w-5 h-5" />}
        >
          NGスレ文追加
        </Button>
        <Button
          variant="menu"
          onClick={handleNgImage}
          icon={<BsImage className="w-5 h-5" />}
        >
          NG画像追加
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
