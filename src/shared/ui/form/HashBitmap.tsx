import { useEffect, useRef } from "react";

interface HashBitmapProps {
  bits: string;
  size?: number; // 表示サイズ（px）デフォルト24
  scale?: number; // 1ドットあたりのpx デフォルト3
}

/** ビット文字列を8x8白黒ドットで描画 */
export const HashBitmap: React.FunctionComponent<HashBitmapProps> = ({
  bits,
  size = 24,
  scale = 3,
}: HashBitmapProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 8 * scale;
    canvas.height = 8 * scale;
    for (let i = 0; i < 64; i++) {
      const x = (i % 8) * scale;
      const y = Math.floor(i / 8) * scale;
      ctx.fillStyle = bits[i] === "1" ? "#ffffff" : "#000000";
      ctx.fillRect(x, y, scale, scale);
    }
  }, [bits, scale]);

  return (
    <canvas
      ref={canvasRef}
      className="border border-border rounded"
      style={{ width: size, height: size, imageRendering: "pixelated" }}
    />
  );
};
