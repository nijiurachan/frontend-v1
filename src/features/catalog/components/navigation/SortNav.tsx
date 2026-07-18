import clsx from "clsx";
import {
  type SortType,
  useCatalogStore,
} from "@/features/catalog/stores/catalogStore";
import { getSortPresentation } from "@/features/catalog/utils/catalogSort";
import {
  PrimaryActionButton,
  type PrimaryActionButtonProps,
} from "@/shared/ui/navigation";

const SORT_OPTIONS: SortType[] = [
  "bump",
  "new",
  "old",
  "replies",
  "momentum",
  "soudane",
];

interface SortNavProps {
  /** バー上に絶対配置で表示する FAB。バー高さに自動追従する。 */
  primaryAction?: Omit<PrimaryActionButtonProps, "className">;
}

export const SortNav: React.FunctionComponent<SortNavProps> = ({
  primaryAction,
}: SortNavProps) => {
  const { currentSort, selectSort } = useCatalogStore();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom)] z-20 flex items-center overflow-x-auto bg-card border-t border-border"
      aria-label="カタログの並び順"
    >
      {primaryAction && (
        <PrimaryActionButton
          {...primaryAction}
          className="absolute right-4 bottom-full mb-2"
        />
      )}
      {SORT_OPTIONS.map((sort) => {
        const isActive = currentSort === sort;
        const presentation = getSortPresentation(sort);

        return (
          <button
            type="button"
            key={sort}
            aria-label={presentation.ariaLabel}
            aria-pressed={isActive}
            className={clsx(
              "min-w-16 flex-1 py-3 text-sm font-medium transition-colors",
              isActive
                ? "text-primary border-t-2 border-primary -mt-px"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={(): void => selectSort(sort)}
          >
            {presentation.label}
          </button>
        );
      })}
    </nav>
  );
};
