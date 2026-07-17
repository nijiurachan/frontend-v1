import clsx from "clsx";
import type { ThreadSummary } from "@/entities/thread";
import { useCatalogStore } from "../stores/catalogStore";

interface TagFilterProps {
  threads: ThreadSummary[];
}

export const TagFilter: React.FunctionComponent<TagFilterProps> = ({
  threads,
}: TagFilterProps) => {
  const { selectedTag, setSelectedTag } = useCatalogStore();
  const tags = Array.from(
    new Set(threads.flatMap((thread) => thread.tags.map((tag) => tag.name))),
  ).sort((a, b) => (a === "R18" ? -1 : b === "R18" ? 1 : a.localeCompare(b)));

  if (tags.length === 0) return null;

  return (
    <fieldset
      className="flex gap-2 overflow-x-auto px-2 pb-2"
      aria-label="タグ絞り込み"
    >
      <button
        type="button"
        className={clsx(
          "shrink-0 rounded-full border px-3 py-1 text-xs",
          selectedTag === null
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground",
        )}
        onClick={(): void => setSelectedTag(null)}
      >
        すべて
      </button>
      {tags.map((tag) => (
        <button
          type="button"
          key={tag}
          className={clsx(
            "shrink-0 rounded-full border px-3 py-1 text-xs",
            selectedTag === tag
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground",
          )}
          onClick={(): void => setSelectedTag(tag)}
        >
          {tag}
        </button>
      ))}
    </fieldset>
  );
};
