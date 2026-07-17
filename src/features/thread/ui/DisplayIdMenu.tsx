import { useMemo, useState } from "react";
import { FiHash, FiSearch, FiSlash } from "react-icons/fi";
import type { Post } from "@/entities/post";
import { useNgStore } from "@/features/ng-filter/stores";
import { Modal } from "@/shared/ui/overlay";
import { DisplayIdSearchModal } from "../components/modals/DisplayIdSearchModal";
import { useReplyModalStore } from "../stores/replyModalStore";

interface DisplayIdMenuProps {
  isOpen: boolean;
  onClose: () => void;
  displayId: string;
  threadId: string;
  allPosts?: Post[];
  quoteReferencesMap?: Map<string, number[]>;
  onQuoteClick?: (quoteText: string) => void;
  isArchived?: boolean;
}

interface ActionItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  variant?: "default" | "destructive";
}

export const DisplayIdMenu: React.FunctionComponent<DisplayIdMenuProps> = ({
  isOpen,
  onClose,
  displayId,
  threadId,
  allPosts,
  quoteReferencesMap,
  onQuoteClick,
  isArchived = false,
}: DisplayIdMenuProps) => {
  const { addNgDisplayId } = useNgStore();
  const openReplyModal = useReplyModalStore((s) => s.open);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // このdisplayIdを持つレスの数を計算
  const postCount = useMemo(() => {
    if (!allPosts) return 0;
    return allPosts.filter((p) => p.displayId === displayId).length;
  }, [allPosts, displayId]);

  const handleSearch = (): void => {
    setSearchModalOpen(true);
    onClose();
  };

  const handleNg = (): void => {
    addNgDisplayId(displayId);
    alert(`ID「${displayId}」をNGリストに追加しました`);
    onClose();
  };

  const handleQuote = (): void => {
    openReplyModal(`ID:${displayId}`);
    onClose();
  };

  const actions: ActionItem[] = [
    {
      icon: FiSearch,
      label: `ID検索 (${postCount}件)`,
      onClick: handleSearch,
    },
    {
      icon: FiSlash,
      label: "IDNG",
      variant: "destructive",
      onClick: handleNg,
    },
  ];
  if (!isArchived) {
    actions.push({
      icon: FiHash,
      label: "ID引用",
      onClick: handleQuote,
    });
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`ID: ${displayId}`}
        position="bottom"
      >
        <div className="p-4">
          <div className="grid grid-cols-3 gap-3">
            {actions.map((action) => (
              <button
                type="button"
                key={action.label}
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

      {/* ID検索結果モーダル */}
      {allPosts && (
        <DisplayIdSearchModal
          isOpen={searchModalOpen}
          onClose={(): void => setSearchModalOpen(false)}
          displayId={displayId}
          posts={allPosts}
          threadId={threadId}
          quoteReferencesMap={quoteReferencesMap}
          onQuoteClick={onQuoteClick}
          isArchived={isArchived}
        />
      )}
    </>
  );
};
