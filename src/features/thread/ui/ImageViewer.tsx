import { AnimatePresence } from "motion/react";

import { ImageViewerContent } from "./ImageViewerContent";

interface ImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  isVideo: boolean;
  alt?: string;
}

export const ImageViewer: React.FunctionComponent<ImageViewerProps> = ({
  isOpen,
  onClose,
  src,
  isVideo,
  alt,
}: ImageViewerProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <ImageViewerContent
          onClose={onClose}
          src={src}
          isVideo={isVideo}
          alt={alt}
        />
      )}
    </AnimatePresence>
  );
};
