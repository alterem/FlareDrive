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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ViewMode } from "@/app/types";
import type { SortKey, SortState } from "@/app/sort";

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  { key: "name", label: "Name", icon: <CaseSensitive /> },
  { key: "size", label: "Size", icon: <Hash /> },
  { key: "modified", label: "Modified", icon: <Clock /> },
];

export function HeaderMenu({
  viewMode,
  onViewModeChange,
  sort,
  onSortChange,
  onShowProgress,
  onLogout,
  username,
}: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  onShowProgress: () => void;
  onLogout: () => void;
  username?: string | null;
}) {
  const [open, setOpen] = useState(false);

  const pickSort = (key: SortKey) => {
    const direction =
      sort.key === key && sort.direction === "asc" ? "desc" : "asc";
    onSortChange({ key, direction });
  };

  const close = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
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
        <DropdownMenuItem onClick={close(() => onViewModeChange("list"))}>
          <List /> List
          {viewMode === "list" && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={close(() => onViewModeChange("grid"))}>
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
        <DropdownMenuItem onClick={close(onShowProgress)}>
          <Activity /> Progress
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={close(onLogout)}>
          <LogOut /> Sign out{username ? ` (${username})` : ""}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
