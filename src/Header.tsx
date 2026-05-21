import { useState } from "react";
import {
  MoreHorizontal,
  LogOut,
  Activity,
  LayoutGrid,
  List,
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  Check,
  CaseSensitive,
  Hash,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_AUTH } from "./app/mockApi";
import type { ViewMode } from "./FileGrid";
import type { SortKey, SortState } from "./app/sort";
import { cn } from "@/lib/utils";

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: "name", label: "Name", icon: <CaseSensitive /> },
  { key: "size", label: "Size", icon: <Hash /> },
  { key: "modified", label: "Modified", icon: <Clock /> },
];

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
  const [open, setOpen] = useState(false);

  const pickSort = (key: SortKey) => {
    if (sort.key === key) {
      onSortChange({ key, direction: sort.direction === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ key, direction: "asc" });
    }
  };

  return (
    <div className="flex items-center gap-2 border-b bg-background/80 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-2 text-sm font-semibold text-brand">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-brand text-white">
          FD
        </div>
        <span className="hidden sm:inline">Flare Drive</span>
        {MOCK_AUTH && (
          <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-500/30">
            Demo
          </span>
        )}
      </div>

      <Input
        placeholder="Search…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="mx-2 max-w-md flex-1"
      />

      <div className="hidden items-center gap-0.5 rounded-md border bg-muted/30 p-0.5 sm:flex">
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon"
          className={cn("h-7 w-7", viewMode === "list" && "shadow-sm")}
          aria-label="List view"
          aria-pressed={viewMode === "list"}
          onClick={() => onViewModeChange("list")}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon"
          className={cn("h-7 w-7", viewMode === "grid" && "shadow-sm")}
          aria-label="Grid view"
          aria-pressed={viewMode === "grid"}
          onClick={() => onViewModeChange("grid")}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="More">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            View as
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              onViewModeChange("list");
            }}
          >
            <List /> List
            {viewMode === "list" && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              onViewModeChange("grid");
            }}
          >
            <LayoutGrid /> Grid
            {viewMode === "grid" && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
            <ArrowDownUp className="h-3 w-3" /> Sort by
          </DropdownMenuLabel>
          {SORT_OPTIONS.map(({ key, label, icon }) => (
            <DropdownMenuItem
              key={key}
              onSelect={(e) => {
                e.preventDefault();
                pickSort(key);
              }}
            >
              {icon} {label}
              {sort.key === key && (
                <span className="ml-auto inline-flex items-center text-muted-foreground">
                  {sort.direction === "asc" ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5" />
                  )}
                </span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              onShowProgress();
            }}
          >
            <Activity /> Progress
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <LogOut /> Sign out{username ? ` (${username})` : ""}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default Header;

