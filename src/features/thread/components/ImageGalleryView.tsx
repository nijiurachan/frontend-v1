import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { ImageItem } from "../utils/extractImages";

interface Props {
  images: ImageItem[];
  initialIndex: number;
}

const PRELOAD_RANGE = 2;

export const ImageGalleryView: React.FunctionComponent<Props> = ({
  images,
  initialIndex,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const hasScrolledRef = useRef(false);

  // フルサイズ画像がロード済みのインデックスを管理
  const [loadedFullSize, setLoadedFullSize] = useState<Set<number>>(new Set());

  // 指定インデックスへスクロール遷移
  const goTo = useCallback(
    (index: number): void => {
      const container = scrollRef.current;
      if (!container) return;
      const clamped = Math.max(0, Math.min(index, images.length - 1));

      container.scrollTo({
        left: clamped * container.clientWidth,
        behavior: "smooth",
      });
      setCurrentIndex(clamped);
    },
    [images.length],
  );

  // 初期位置へスクロール（アニメーションなし）
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || hasScrolledRef.current) return;
    hasScrolledRef.current = true;
    container.scrollTo({ left: initialIndex * container.clientWidth });
  }, [initialIndex]);

  // スクロール位置から currentIndex を同期
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const updateIndex = (): void => {
      const w = container.clientWidth;
      if (w === 0) return;
      const idx = Math.round(container.scrollLeft / w);
      setCurrentIndex(Math.max(0, Math.min(idx, images.length - 1)));
    };

    // scrollend が使えるブラウザはそちらを優先（snap 確定後に1回だけ発火）
    if ("onscrollend" in window) {
      container.addEventListener("scrollend", updateIndex);
      return (): void =>
        container.removeEventListener("scrollend", updateIndex);
    }

    // フォールバック: デバウンス付き scroll
    let timer: ReturnType<typeof setTimeout>;
    const onScroll = (): void => {
      clearTimeout(timer);
      timer = setTimeout(updateIndex, 150);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return (): void => {
      clearTimeout(timer);
      container.removeEventListener("scroll", onScroll);
    };
  }, [images.length]);

  // デバイス回転時にスクロール位置を現在のインデックスに再スナップ
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let timer: ReturnType<typeof setTimeout>;
    const onResize = (): void => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        container.scrollTo({ left: currentIndex * container.clientWidth });
      }, 100);
    };
    window.addEventListener("resize", onResize);
    return (): void => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [currentIndex]);

  // currentIndex 変更時に近傍のフルサイズ画像をプリロード
  useEffect(() => {
    const toLoad: number[] = [];
    for (
      let i = currentIndex - PRELOAD_RANGE;
      i <= currentIndex + PRELOAD_RANGE;
      i++
    ) {
      if (
        i >= 0 &&
        i < images.length &&
        !loadedFullSize.has(i) &&
        !images[i].isVideo
      ) {
        toLoad.push(i);
      }
    }
    if (toLoad.length === 0) return;

    for (const idx of toLoad) {
      const img = new Image();
      img.src = images[idx].path;
      img.onload = (): void => {
        setLoadedFullSize((prev) => {
          if (prev.has(idx)) return prev;
          const next = new Set(prev);
          next.add(idx);
          return next;
        });
      };
    }
  }, [currentIndex, images, loadedFullSize]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* カウンター + 矢印ボタン */}
      <div className="flex items-center justify-center gap-4 py-2 text-sm text-muted-foreground">
        <button
          type="button"
          onClick={(): void => void (hasPrev && goTo(currentIndex - 1))}
          disabled={!hasPrev}
          className="p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-default"
          aria-label="前の画像"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <span>
          {currentIndex + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={(): void => void (hasNext && goTo(currentIndex + 1))}
          disabled={!hasNext}
          className="p-1 rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-default"
          aria-label="次の画像"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* スライドショー本体 */}
      <div
        ref={scrollRef}
        className="flex-1 flex overflow-x-auto overflow-y-hidden scrollbar-none snap-x snap-mandatory overscroll-x-contain"
      >
        {images.map((image, index) => (
          <div
            key={image.id}
            className="w-full flex-shrink-0 flex items-center justify-center p-2 snap-center"
          >
            {image.isVideo ? (
              /* biome-ignore lint/a11y/useMediaCaption: ユーザー投稿動画のため字幕トラックは提供不可 */
              <video
                src={image.path}
                controls
                playsInline
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <img
                src={loadedFullSize.has(index) ? image.path : image.thumbnail}
                alt=""
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
