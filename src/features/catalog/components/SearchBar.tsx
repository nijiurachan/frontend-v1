import { useCallback } from "react";
import { FiX } from "react-icons/fi";
import { Input } from "@/shared/ui/form";
import { useCatalogStore } from "../stores/catalogStore";

export const SearchBar: React.FunctionComponent = () => {
  const { searchQuery, setSearchQuery } = useCatalogStore();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    [setSearchQuery],
  );

  const handleClear = useCallback(() => {
    setSearchQuery("");
  }, [setSearchQuery]);

  return (
    <div className="relative flex items-center">
      <Input
        type="text"
        value={searchQuery}
        onChange={handleChange}
        placeholder="スレッド文検索"
        className="pr-8"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="検索クリア"
        >
          <FiX size={18} />
        </button>
      )}
    </div>
  );
};
