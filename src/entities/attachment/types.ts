export interface Attachment {
  path: string;
  thumbnail: string;
  mime_type: string;
  width: number;
  height: number;
  ng_hash: string;
  is_oekaki: boolean;
  /** ファイルサイズ。単位はバイト */
  size: number;
  /** アニメーション画像 (GIF/APNG/Animated WebP など) かどうか。サムネではなくフルサイズで表示するかの判定に使う */
  is_animated: boolean;
}
