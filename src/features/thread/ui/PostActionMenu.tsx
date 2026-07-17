import { useState } from "react";
import {
  FiArrowLeft,
  FiFlag,
  FiHash,
  FiSlash,
  FiThumbsDown,
  FiThumbsUp,
  FiTrash2,
} from "react-icons/fi";
import type { Post } from "@/entities/post";
import { useNgStore } from "@/features/ng-filter/stores";
import { useSettingsStore } from "@/features/settings/hooks";
import { useCloseMutation } from "@/features/thread/hooks/useCloseMutation";
import { useDeleteMutation } from "@/shared/hooks/useDeleteMutation";
import { useDelMutation } from "@/shared/hooks/useDelMutation";
import { ConfirmDialog, Modal } from "@/shared/ui/overlay";
import { ReportModal } from "../components/modals/ReportModal";
import { useSoudaneMutation } from "../hooks/useSoudaneMutation";
import { useReplyModalStore } from "../stores/replyModalStore";

interface PostActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
  onJumpToPost?: (postSeq: number) => void;
  isArchived?: boolean;
  maxSeq?: number;
}

interface ActionItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  variant?: "default" | "destructive";
}

type QuoteType = "body" | "no";

export const PostActionMenu: React.FunctionComponent<PostActionMenuProps> = ({
  isOpen,
  onClose,
  post,
  isArchived = false,
  maxSeq = post.seq,
}: PostActionMenuProps) => {
  const openReplyModal = useReplyModalStore((s) => s.open);
  const { addNgWord } = useNgStore();
  const { mutate: soudane } = useSoudaneMutation();
  const { mutate: del } = useDelMutation();
  const { mutate: deletePostOrThread } = useDeleteMutation();
  const { mutate: closeThread } = useCloseMutation(post.threadId);
  const { deleteKey } = useSettingsStore();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);

  // 引用テキストを生成
  const getQuoteText = (type: QuoteType): string => {
    if (type === "no") {
      return `>No.${post.seq}`;
    } else {
      // 本文引用の場合
      return post.body
        .split(/\r?\n/)
        .map((line) => `>${line}`)
        .join("\n");
    }
  };

  // 返信モーダルを開く共通処理
  const handleReply = (type: QuoteType): void => {
    openReplyModal(`${getQuoteText(type)}\n`);
    onClose();
  };

  // 本文NGハンドラー
  const handleNgBody = (): void => {
    const plainText = post.body.trim();
    addNgWord(plainText);
    alert("本文をNGワードに追加しました");
    onClose();
  };
  const actions: ActionItem[] = [
    {
      icon: FiArrowLeft,
      label: "本文返信",
      onClick: () => handleReply("body"),
    },
    {
      icon: FiHash,
      label: "No返信",
      onClick: () => handleReply("no"),
    },
    {
      icon: FiThumbsUp,
      label: "そうだね",
      onClick: isArchived
        ? undefined
        : () => {
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
    {
      icon: FiThumbsDown,
      label: post.delCount == null ? "del" : `del (${post.delCount})`,
      variant: "destructive" as const,
      onClick: isArchived
        ? undefined
        : () => {
            del(post.id);
            onClose();
          },
    },
    {
      icon: FiFlag,
      label: "通報",
      onClick: () => {
        setIsReportModalOpen(true);
        onClose();
      },
    },
  ];

  if (post.seq === 0) {
    actions.push({
      icon: FiTrash2,
      label: "スレを閉じる",
      variant: "destructive",
      onClick: () => {
        setIsCloseDialogOpen(true);
        onClose();
      },
    });
  }

  return (
    <>
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
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={(): void => setIsReportModalOpen(false)}
        threadId={post.threadId}
        postSeq={post.seq}
        maxSeq={maxSeq}
      />
      <ConfirmDialog
        isOpen={isCloseDialogOpen}
        onClose={(): void => setIsCloseDialogOpen(false)}
        onConfirm={(): void => closeThread(deleteKey)}
        title="スレを閉じる"
        message={"このスレッドを閉じますか？\n返信を受け付けなくなります。"}
        confirmText="閉じる"
        variant="destructive"
      />
    </>
  );
};
