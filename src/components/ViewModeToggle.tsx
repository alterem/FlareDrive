import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/app/types";

export function ViewModeToggle({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="hidden items-center gap-0.5 rounded-md border bg-muted/30 p-0.5 sm:flex">
      <Button
        variant={viewMode === "list" ? "secondary" : "ghost"}
        size="icon"
        className={cn("h-7 w-7", viewMode === "list" && "shadow-sm")}
        aria-label="List view"
        aria-pressed={viewMode === "list"}
        onClick={() => onChange("list")}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "grid" ? "secondary" : "ghost"}
        size="icon"
        className={cn("h-7 w-7", viewMode === "grid" && "shadow-sm")}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
        onClick={() => onChange("grid")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
