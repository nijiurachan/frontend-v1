export interface OgpMetadata {
  title?: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  imageWidth?: string;
  imageHeight?: string;
  url?: string;
  type?: string;
  siteName?: string;
  favicon?: string;
}

export interface OgpData {
  url: string;
  data: OgpMetadata;
  cached: boolean;
}
