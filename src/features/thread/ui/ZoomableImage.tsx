import { useZoomableImage } from "../hooks/useZoomableImage";

export type ZoomableImageProps = {
  src: string;
  alt?: string;
};

export const ZoomableImage: React.FunctionComponent<ZoomableImageProps> = ({
  src,
  alt,
}: ZoomableImageProps) => {
  const { imgRef, transform, isZoomed, interactionProps, onImageLoad } =
    useZoomableImage({
      minScale: 1,
      maxScale: 4,
    });

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ touchAction: "none", cursor: isZoomed ? "grab" : "auto" }}
      {...interactionProps}
    >
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          transform: `translate3d(${transform.tx}px, ${transform.ty}px, 0)`,
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt ?? ""}
          draggable={!isZoomed}
          className="max-w-full max-h-full object-contain select-none"
          style={{
            transform: `scale(${transform.scale})`,
            transformOrigin: "0 0",
            cursor: isZoomed ? "grab" : "auto",
          }}
          onLoad={onImageLoad}
        />
      </div>
    </div>
  );
};
