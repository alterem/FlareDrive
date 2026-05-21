import { Input } from "@/components/ui/input";
import { HeaderBrand } from "./components/HeaderBrand";
import { ViewModeToggle } from "./components/ViewModeToggle";
import { HeaderMenu } from "./components/HeaderMenu";
import type { ViewMode } from "./app/types";
import type { SortState } from "./app/sort";

function Header({
  search,
  onSearchChange,
  onShowProgress,
  onLogout,
  username,
  viewMode,
  onViewModeChange,
  sort,
  onSortChange,
}: {
  search: string;
  onSearchChange: (newSearch: string) => void;
  onShowProgress: () => void;
  onLogout: () => void;
  username?: string | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b bg-background/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <HeaderBrand />
      <Input
        placeholder="Search…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="mx-2 max-w-md flex-1"
      />
      <ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
      <HeaderMenu
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        sort={sort}
        onSortChange={onSortChange}
        onShowProgress={onShowProgress}
        onLogout={onLogout}
        username={username}
      />
    </div>
  );
}

export default Header;
