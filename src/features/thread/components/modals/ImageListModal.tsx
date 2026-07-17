import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HiDotsVertical } from "react-icons/hi";
import type { Post } from "@/entities/post";
import { VideoPlayOverlay } from "@/shared/ui/media";
import { Modal } from "@/shared/ui/overlay";
import { PostActionMenu } from "../../ui";
import type { ImageItem } from "../../utils/extractImages";

interface ImageListModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageItem[];
  onImageClick?: (image: ImageItem) => void;
  allPosts?: Post[];
  onJumpToPost?: (postIndex: number) => void;
}

/**
 * 画像一覧モーダルコンポーネント
 * スレッド内の全画像をグリッド表示する
 */
export const ImageListModal: React.FunctionComponent<ImageListModalProps> = ({
  isOpen,
  onClose,
  images,
  onImageClick,
  allPosts = [],
  onJumpToPost,
}: ImageListModalProps) => {
  const [menuPost, setMenuPost] = useState<Post | null>(null);
  const [lastValidMenuPost, setLastValidMenuPost] = useState<Post | null>(null);

  // menuPostが有効な値のとき、それを保持する（アニメーション用）
  useEffect(() => {
    if (menuPost) {
      setLastValidMenuPost(menuPost);
    }
  }, [menuPost]);

  const handleMenuClick = (e: React.MouseEvent, postId: string): void => {
    e.stopPropagation();
    const post = allPosts.find((p) => p.id === postId);
    if (post) {
      setMenuPost(post);
    }
  };

  const handleCloseMenu = (): void => {
    setMenuPost(null);
  };

  const handleJumpToPost = (): void => {
    if (!lastValidMenuPost || !onJumpToPost) return;
    const post = allPosts.find((p) => p.id === lastValidMenuPost.id);
    if (post) {
      onJumpToPost(post.seq);
    }
  };

  if (images.length === 0 || allPosts.length === 0) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="画像一覧"
        position="bottom"
      >
        <div className="p-8 text-center text-muted-foreground">
          画像がありません
        </div>
      </Modal>
    );
  }

  const [{ threadId }] = allPosts;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="画像一覧"
        position="bottom"
      >
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2">
            {images.map((image, index) => (
              <div key={image.id} className="relative">
                <Link
                  to="/gallery/$threadId"
                  params={{ threadId: String(threadId) }}
                  search={{ start: index }}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(): void => {
                    onClose();
                    onImageClick?.(image);
                  }}
                  className="relative aspect-square overflow-hidden rounded-lg bg-muted hover:opacity-80 transition-opacity flex items-center justify-center w-full"
                >
                  <img
                    src={image.thumbnail}
                    alt={image.path}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                  {image.isVideo && <VideoPlayOverlay size="medium" />}
                </Link>
                {image.postId && (
                  <button
                    type="button"
                    onClick={(e: React.MouseEvent): void => {
                      if (image.postId !== undefined) {
                        handleMenuClick(e, image.postId); // ! を削除
                      }
                    }}
                    className="absolute top-1 right-1 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                    aria-label="メニュー"
                  >
                    <HiDotsVertical className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {lastValidMenuPost && (
        <PostActionMenu
          isOpen={menuPost !== null}
          onClose={handleCloseMenu}
          post={lastValidMenuPost}
          onJumpToPost={onJumpToPost ? handleJumpToPost : undefined}
        />
      )}
    </>
  );
};
