/** backend-v1 AttachmentView */
export type AttachmentKind = "image" | "animated" | "video";

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  mime: string;
  width: number | null;
  height: number | null;
  originalUrl: string;
  thumbnailUrl: string;
  ngHash: string | null;
}
