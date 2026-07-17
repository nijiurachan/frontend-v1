import type { Post } from "@/entities/post";
import { resolveUploadPath } from "@/entities/thread";
import { decorateTitle, isVideoAttachment } from "@/shared/lib";

interface Props {
  post: Post;
}

export const PostBlock: React.FunctionComponent<Props> = ({ post }: Props) => {
  const hasBody = post.body.trim().length > 0;
  const attachment = post.attachment;

  if (!hasBody && !attachment) return null;

  const imageSrc = attachment
    ? resolveUploadPath(
        isVideoAttachment(attachment)
          ? attachment.thumbnailUrl
          : attachment.originalUrl,
      )
    : null;

  return (
    <section className="sw-post-block">
      {hasBody && <p>{decorateTitle(post.body)}</p>}
      {imageSrc && (
        <img
          className="sw-post-image"
          src={imageSrc}
          alt=""
          loading="lazy"
          onError={(e: React.SyntheticEvent<HTMLImageElement>): void => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </section>
  );
};
