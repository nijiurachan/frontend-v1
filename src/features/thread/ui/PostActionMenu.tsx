import { BsImage } from "react-icons/bs";
import {
  FiArrowLeft,
  FiHash,
  FiSlash,
  FiThumbsDown,
  FiThumbsUp,
  FiTrash2,
} from "react-icons/fi";
import type { Post } from "@/entities/post";
import {
  addNgImageFromAttachment,
  useNgStore,
} from "@/features/ng-filter/stores";
import { useSettingsStore } from "@/features/settings/hooks";
import { useDeleteMutation } from "@/shared/hooks/useDeleteMutation";
import { useDelMutation } from "@/shared/hooks/useDelMutation";
import { Modal } from "@/shared/ui/overlay";
import { useSoudaneMutation } from "../hooks/useSoudaneMutation";
import { useReplyModalStore } from "../stores/replyModalStore";

interface PostActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onJumpToPost?: () => void;
}

interface ActionItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  variant?: "default" | "destructive";
}

type QuoteType = "body" | "no-and-filename";

export const PostActionMenu: React.FunctionComponent<PostActionMenuProps> = ({
  isOpen,
  onClose,
  post,
}: PostActionMenuProps) => {
  const openReplyModal = useReplyModalStore((s) => s.open);
  const { addNgWord } = useNgStore();
  const { mutate: soudane } = useSoudaneMutation();
  const { mutate: del } = useDelMutation();
  const { mutate: deletePostOrThread } = useDeleteMutation();
  const { deleteKey } = useSettingsStore();

  // 引用テキストを生成
  const getQuoteText = (type: QuoteType): string => {
    if (type === "no-and-filename") {
      return post.attachment?.path
        ? `>No.${post.id}\n>${post.attachment.path.replace(/^uploads\//, "")}`
        : `>No.${post.id}`;
    } else {
      // 本文引用の場合
      return post.body.map((line) => `>${line.text}`).join("\n");
    }
  };

  // 返信モーダルを開く共通処理
  const handleReply = (type: QuoteType): void => {
    openReplyModal(getQuoteText(type));
    onClose();
  };

  // 本文NGハンドラー
  const handleNgBody = (): void => {
    const plainText = post.plainBody.trim();
    addNgWord(plainText);
    alert("本文をNGワードに追加しました");
    onClose();
  };
  const attachment = post.attachment;

  const actions: ActionItem[] = [
    {
      icon: FiArrowLeft,
      label: "本文返信",
      onClick: () => handleReply("body"),
    },
    {
      icon: FiHash,
      label: "No＆添付名返信",
      onClick: () => handleReply("no-and-filename"),
    },
    {
      icon: FiThumbsUp,
      label: "そうだね",
      onClick: () => {
        soudane(post.id);
        onClose();
      },
    },
    {
      icon: FiTrash2,
      label: "削除",
      variant: "destructive" as const,
      onClick: () => {
        deletePostOrThread({ postId: post.id, password: deleteKey });
        onClose();
      },
    },
    {
      icon: FiSlash,
      label: "本文NG",
      variant: "destructive" as const,
      onClick: handleNgBody,
    },
    // 画像NG
    {
      icon: BsImage,
      label: "画像NG",
      variant: "destructive" as const,
      onClick: attachment
        ? () => {
            addNgImageFromAttachment(attachment);
            onClose();
          }
        : undefined,
    },
    {
      icon: FiThumbsDown,
      label: "del",
      variant: "destructive" as const,
      onClick: () => {
        del(post.id);
        onClose();
      },
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="アクション"
      position="bottom"
    >
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {actions.map((action) => (
            <button
              type="button"
              key={action.label}
              disabled={!action.onClick}
              onClick={action.onClick}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              <action.icon
                className={
                  action.variant === "destructive"
                    ? "w-6 h-6 text-destructive"
                    : "w-6 h-6 text-primary"
                }
              />
              <span className="text-sm text-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};
