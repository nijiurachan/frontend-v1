import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";

import { ZoomableImage } from "@/features/thread/ui/ZoomableImage";

export interface ImageViewerContentProps {
  onClose: () => void;
  src: string;
  isVideo: boolean;
  alt?: string;
}

export const ImageViewerContent: React.FunctionComponent<
  ImageViewerContentProps
> = ({ onClose, src, isVideo, alt }: ImageViewerContentProps) => {
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = useRef(false);

  const requestClose = useCallback((): void => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    requestAnimationFrame(() => onClose());
  }, [onClose]);

  useEffect(() => {
    const body = document.body;
    const prevBodyOverflow = body.style.overflow;

    body.style.overflow = "hidden";

    return (): void => {
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={requestClose}
      style={{ pointerEvents: isClosing ? "none" : "auto" }}
    >
      {isVideo ? (
        <motion.video
          src={src}
          controls
          autoPlay
          className="max-w-full max-h-full"
          onClick={(e: React.MouseEvent): void => e.stopPropagation()}
        >
          <track kind="captions" />
        </motion.video>
      ) : (
        <ZoomableImage key={src} src={src} alt={alt} />
      )}
      <button
        type="button"
        onClick={requestClose}
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="閉じる"
      >
        <FiX className="w-6 h-6" />
      </button>
    </motion.div>
  );
};
