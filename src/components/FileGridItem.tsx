import { basename, isDirectory } from "@/app/path";
import type { FileItem } from "@/app/types";
import { humanReadableSize } from "@/app/utils";
import { cn } from "@/lib/utils";
import { FileThumbnail } from "./FileThumbnail";

export function FileGridItem({
  file,
  selected,
  onActivate,
  onLongPress,
}: {
  file: FileItem;
  selected: boolean;
  onActivate: () => void;
  onLongPress: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onActivate}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress();
      }}
      className={cn(
        "group flex flex-col items-center gap-2 rounded-lg border border-transparent p-3 text-center transition-colors hover:border-border hover:bg-accent",
        selected && "border-ring bg-accent ring-1 ring-ring",
      )}
    >
      <div className="grid h-14 w-14 place-items-center">
        <FileThumbnail file={file} size="lg" />
      </div>
      <div className="min-w-0 max-w-full">
        <div className="truncate text-sm font-medium" title={basename(file.key)}>
          {basename(file.key)}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {isDirectory(file) ? "Folder" : humanReadableSize(file.size)}
        </div>
      </div>
    </button>
  );
}
