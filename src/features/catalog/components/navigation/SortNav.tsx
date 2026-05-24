import clsx from "clsx";
import {
  PrimaryActionButton,
  type PrimaryActionButtonProps,
} from "@/shared/ui/navigation";
import { type SortType, useCatalogStore } from "../../stores/catalogStore";

const SORT_OPTIONS: { key: SortType; label: string }[] = [
  { key: "default", label: "カタ" },
  { key: "created", label: "新順" },
  { key: "old", label: "古順" },
  { key: "replies", label: "多順" },
  { key: "momentum", label: "勢順" },
  { key: "soudane", label: "そ順" },
];

interface SortNavProps {
  /** バー上に絶対配置で表示する FAB。バー高さに自動追従する。 */
  primaryAction?: Omit<PrimaryActionButtonProps, "className">;
}

export const SortNav: React.FunctionComponent<SortNavProps> = ({
  primaryAction,
}: SortNavProps) => {
  const { currentSort, setSort } = useCatalogStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] z-20 flex items-center justify-around bg-card border-t border-border">
      {primaryAction && (
        <PrimaryActionButton
          {...primaryAction}
          className="absolute right-4 bottom-full mb-2"
        />
      )}
      {SORT_OPTIONS.map(({ key, label }) => (
        <button
          type="button"
          key={key}
          className={clsx(
            "flex-1 py-3 text-sm font-medium transition-colors",
            currentSort === key
              ? "text-primary border-t-2 border-primary -mt-px"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={(): void => setSort(key)}
        >
          {label}
        </button>
      ))}
    </nav>
  );
};
