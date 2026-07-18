import clsx from "clsx";
import type { ThreadTag } from "@/entities/thread";

interface TagBadgesProps {
  tags: ThreadTag[];
  className?: string;
}

export const TagBadges: React.FunctionComponent<TagBadgesProps> = ({
  tags,
  className,
}: TagBadgesProps) => {
  if (tags.length === 0) return null;

  return (
    <div className={clsx("flex flex-wrap gap-1", className)}>
      {tags.map((tag) => (
        <span
          key={`${tag.source}:${tag.kind}:${tag.name}`}
          className={clsx(
            "rounded px-1.5 py-0.5 text-2xs font-medium",
            tag.name === "R18"
              ? "bg-destructive/80 text-destructive-foreground"
              : tag.kind === "fixed"
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground",
          )}
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
};
