import { useState } from "react";
import {
  Download,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function MultiSelectToolbar({
  multiSelected,
  onClose,
  onDownload,
  onRename,
  onDelete,
  onShare,
}: {
  multiSelected: string[] | null;
  onClose: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const visible = multiSelected !== null;
  const single = multiSelected?.length === 1;
  const singleFile = single && !multiSelected![0].endsWith("/");

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t bg-background px-2 py-2 shadow-lg transition-transform",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={!singleFile}
        onClick={onDownload}
      >
        <Download />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete}>
        <Trash2 />
      </Button>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={!singleFile}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setMenuOpen(false);
              onRename();
            }}
          >
            <Pencil /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setMenuOpen(false);
              onShare();
            }}
          >
            <Share2 /> Share
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default MultiSelectToolbar;
